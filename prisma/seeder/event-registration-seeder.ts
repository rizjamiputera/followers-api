import { faker } from '@faker-js/faker';
import { PrismaClient, RegistrationStatus } from '@prisma/client';

export async function EventRegistrationSeed(prisma: PrismaClient) {
    console.log('\nSeed Start: Event Registration');

    // Get existing published events (including past events for demo purposes)
    const publishedEvents = await prisma.event.findMany({
        where: {
            status: 'PUBLISHED',
        },
        take: 15, // Limit to 15 events for registration configs
        orderBy: { start_at: 'desc' }
    });

    console.log(`Found ${publishedEvents.length} published events`);

    // If no published events, try to get some approved events and make them future events
    if (publishedEvents.length === 0) {
        const approvedEvents = await prisma.event.findMany({
            where: {
                OR: [
                    { status: 'APPROVED' },
                    { status: 'PUBLISHED' }
                ]
            },
            take: 10
        });

        console.log(`Found ${approvedEvents.length} approved events, updating them for registration demo`);

        // Update some events to be future events with published status
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 30); // 30 days from now

        const updatePromises = approvedEvents.slice(0, 8).map((event, index) => {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() + 10 + index * 3); // Spread events over time
            
            const endDate = new Date(startDate);
            endDate.setHours(startDate.getHours() + 3); // 3 hour events

            return prisma.event.update({
                where: { id: event.id },
                data: {
                    status: 'PUBLISHED',
                    publishedAt: new Date(),
                    start_at: startDate,
                    end_at: endDate
                }
            });
        });

        await Promise.all(updatePromises);
        console.log(`Updated ${updatePromises.length} events to be future published events`);

        // Re-fetch the updated events
        const updatedEvents = await prisma.event.findMany({
            where: {
                status: 'PUBLISHED',
                start_at: { gte: new Date() }
            },
            take: 15
        });

        publishedEvents.splice(0, publishedEvents.length, ...updatedEvents);
    }

    if (publishedEvents.length === 0) {
        console.log('No published events found. Please run event seeder first.');
        return;
    }

    // Get all users for creating registrations
    const users = await prisma.user.findMany({
        where: { role: 'USER' },
        take: 50,
    });

    if (users.length === 0) {
        console.log('No users found. Please run user seeder first.');
        return;
    }

    // Create registration configurations for selected events
    const registrationConfigPromises = [];
    
    for (const event of publishedEvents) {
        // 80% chance of having registration enabled
        if (faker.datatype.boolean(0.8)) {
            const configTypes = [
                'tech_meetup',
                'workshop',
                'seminar',
                'networking',
                'conference'
            ];
            
            const configType = faker.helpers.arrayElement(configTypes);
            const formFields = generateFormFieldsForType(configType);
            
            const registrationConfigPromise = prisma.eventRegistrationConfig.create({
                data: {
                    eventId: event.id,
                    isEnabled: true,
                    participantLimit: faker.helpers.maybe(
                        () => faker.number.int({ min: 10, max: 100 }),
                        { probability: 0.7 }
                    ),
                    registrationStart: faker.helpers.maybe(
                        () => faker.date.recent({ days: 30 }),
                        { probability: 0.3 }
                    ),
                    registrationEnd: faker.helpers.maybe(
                        () => {
                            const now = new Date();
                            const eventStart = new Date(event.start_at);
                            // Make sure we have a valid date range
                            if (eventStart <= now) {
                                // For past events, set registration end to a past date
                                const pastDate = new Date(eventStart);
                                pastDate.setDate(pastDate.getDate() - 1);
                                return pastDate;
                            }
                            return faker.date.between({
                                from: now,
                                to: eventStart
                            });
                        },
                        { probability: 0.6 }
                    ),
                    formFields: formFields as any,
                    requireApproval: faker.datatype.boolean(0.3), // 30% require approval
                    confirmationMessage: generateConfirmationMessage(configType),
                }
            });
            
            registrationConfigPromises.push(registrationConfigPromise);
        }
    }

    const createdConfigs = await Promise.all(registrationConfigPromises);
    console.log(`Created ${createdConfigs.length} registration configurations`);

    // Create sample registrations for events with configs
    const eventsWithConfigs = await prisma.event.findMany({
        where: {
            registrationConfig: { isEnabled: true }
        },
        include: {
            registrationConfig: true
        },
        take: 10
    });

    const registrationPromises = [];
    
    for (const event of eventsWithConfigs) {
        if (!event.registrationConfig) continue;
        
        // Generate 5-25 registrations per event
        const registrationCount = faker.number.int({ min: 5, max: 25 });
        const selectedUsers = faker.helpers.arrayElements(users, registrationCount);
        
        for (const user of selectedUsers) {
            const formData = generateFormDataForConfig(event.registrationConfig.formFields as any);
            
            const status = event.registrationConfig.requireApproval 
                ? faker.helpers.arrayElement([
                    RegistrationStatus.PENDING,
                    RegistrationStatus.CONFIRMED,
                    RegistrationStatus.CANCELLED
                ])
                : faker.helpers.arrayElement([
                    RegistrationStatus.CONFIRMED,
                    RegistrationStatus.CANCELLED
                ]);

            const registrationPromise = prisma.eventRegistration.create({
                data: {
                    eventId: event.id,
                    userId: user.id,
                    formData: formData as any,
                    status,
                    registeredAt: faker.date.recent({ days: 14 }),
                    confirmedAt: status === RegistrationStatus.CONFIRMED 
                        ? faker.date.recent({ days: 10 }) 
                        : null,
                    cancelledAt: status === RegistrationStatus.CANCELLED 
                        ? faker.date.recent({ days: 5 }) 
                        : null,
                    cancellationNote: status === RegistrationStatus.CANCELLED 
                        ? faker.helpers.arrayElement([
                            'Schedule conflict',
                            'Personal reasons',
                            'Unable to attend',
                            'Changed plans'
                        ])
                        : null,
                }
            });
            
            registrationPromises.push(registrationPromise);
        }
    }

    const createdRegistrations = await Promise.all(registrationPromises);
    console.log(`Created ${createdRegistrations.length} event registrations`);

    console.log('\nSeed End: Event Registration');
}

function generateFormFieldsForType(configType: string) {
    const baseFields = [
        {
            key: 'phone',
            label: 'Phone Number',
            type: 'PHONE',
            required: true,
            placeholder: '+62 123 456 7890'
        }
    ];

    const typeSpecificFields = {
        tech_meetup: [
            {
                key: 'experience_level',
                label: 'Experience Level',
                type: 'SELECT',
                required: true,
                options: ['Beginner', 'Intermediate', 'Advanced', 'Expert']
            },
            {
                key: 'company',
                label: 'Company/Organization',
                type: 'TEXT',
                required: false,
                placeholder: 'Your company name'
            },
            {
                key: 'interests',
                label: 'Technical Interests',
                type: 'CHECKBOX',
                required: false,
                options: ['Frontend', 'Backend', 'DevOps', 'Mobile', 'AI/ML', 'Data Science']
            }
        ],
        workshop: [
            {
                key: 'laptop_specs',
                label: 'Laptop Specifications',
                type: 'TEXTAREA',
                required: true,
                placeholder: 'Please describe your laptop specs (OS, RAM, etc.)'
            },
            {
                key: 'dietary_requirements',
                label: 'Dietary Requirements',
                type: 'SELECT',
                required: false,
                options: ['None', 'Vegetarian', 'Vegan', 'Halal', 'Gluten-free']
            },
            {
                key: 'emergency_contact',
                label: 'Emergency Contact',
                type: 'PHONE',
                required: true,
                placeholder: 'Emergency contact number'
            }
        ],
        seminar: [
            {
                key: 'organization',
                label: 'Organization/Institution',
                type: 'TEXT',
                required: false
            },
            {
                key: 'position',
                label: 'Job Title/Position',
                type: 'TEXT',
                required: false
            },
            {
                key: 'expectations',
                label: 'What do you expect from this seminar?',
                type: 'TEXTAREA',
                required: false,
                placeholder: 'Share your expectations...'
            }
        ],
        networking: [
            {
                key: 'linkedin_profile',
                label: 'LinkedIn Profile',
                type: 'TEXT',
                required: false,
                placeholder: 'https://linkedin.com/in/yourprofile'
            },
            {
                key: 'industry',
                label: 'Industry',
                type: 'SELECT',
                required: false,
                options: ['Technology', 'Finance', 'Healthcare', 'Education', 'Marketing', 'Other']
            },
            {
                key: 'networking_goals',
                label: 'Networking Goals',
                type: 'CHECKBOX',
                required: false,
                options: ['Find business partners', 'Career opportunities', 'Knowledge sharing', 'Mentorship']
            }
        ],
        conference: [
            {
                key: 'badge_name',
                label: 'Name for Badge',
                type: 'TEXT',
                required: true,
                placeholder: 'How should we print your name on the badge?'
            },
            {
                key: 'accommodation_needed',
                label: 'Need Accommodation?',
                type: 'RADIO',
                required: true,
                options: ['Yes', 'No']
            },
            {
                key: 'sessions_of_interest',
                label: 'Sessions of Interest',
                type: 'CHECKBOX',
                required: false,
                options: ['Keynote', 'Technical Sessions', 'Workshops', 'Panel Discussions', 'Networking']
            },
            {
                key: 'special_requirements',
                label: 'Special Requirements',
                type: 'TEXTAREA',
                required: false,
                placeholder: 'Any accessibility needs or special requirements?'
            }
        ]
    };

    return [
        ...baseFields,
        ...(typeSpecificFields[configType] || typeSpecificFields.seminar)
    ];
}

function generateFormDataForConfig(formFields: any[]) {
    const formData = {};

    for (const field of formFields) {
        if (field.required || faker.datatype.boolean(0.7)) { // 70% chance to fill optional fields
            switch (field.type) {
                case 'TEXT':
                    if (field.key === 'company' || field.key === 'organization') {
                        formData[field.key] = faker.company.name();
                    } else if (field.key === 'position') {
                        formData[field.key] = faker.person.jobTitle();
                    } else if (field.key === 'linkedin_profile') {
                        formData[field.key] = `https://linkedin.com/in/${faker.internet.username()}`;
                    } else if (field.key === 'badge_name') {
                        formData[field.key] = faker.person.fullName();
                    } else {
                        formData[field.key] = faker.lorem.words({ min: 1, max: 4 });
                    }
                    break;
                    
                case 'EMAIL':
                    formData[field.key] = faker.internet.email();
                    break;
                    
                case 'PHONE':
                    formData[field.key] = faker.phone.number();
                    break;
                    
                case 'NUMBER':
                    formData[field.key] = faker.number.int({ min: 1, max: 100 });
                    break;
                    
                case 'TEXTAREA':
                    if (field.key === 'laptop_specs') {
                        formData[field.key] = `${faker.helpers.arrayElement(['Windows 11', 'macOS', 'Ubuntu Linux'])}, ${faker.number.int({ min: 8, max: 32 })}GB RAM, ${faker.helpers.arrayElement(['Intel', 'AMD', 'M1', 'M2'])} processor`;
                    } else {
                        formData[field.key] = faker.lorem.paragraph();
                    }
                    break;
                    
                case 'SELECT':
                case 'RADIO':
                    formData[field.key] = faker.helpers.arrayElement(field.options);
                    break;
                    
                case 'CHECKBOX':
                    const selectedCount = faker.number.int({ min: 1, max: Math.min(3, field.options.length) });
                    formData[field.key] = faker.helpers.arrayElements(field.options, selectedCount);
                    break;
                    
                case 'DATE':
                    formData[field.key] = faker.date.future().toISOString().split('T')[0];
                    break;
                    
                default:
                    formData[field.key] = faker.lorem.word();
            }
        }
    }

    return formData;
}

function generateConfirmationMessage(configType: string) {
    const messages = {
        tech_meetup: 'Thank you for registering! We\'re excited to have you join our tech meetup. You\'ll receive a confirmation email with the agenda and networking details soon.',
        workshop: 'Registration successful! Please make sure to bring your laptop and check the technical requirements we\'ll send via email. Looking forward to seeing you at the workshop!',
        seminar: 'Thank you for your interest in our seminar. Your registration has been confirmed. We\'ll send you the presentation materials and additional resources before the event.',
        networking: 'Welcome to our networking event! We\'ve received your registration and will be in touch with details about the venue and networking activities. Don\'t forget to prepare your elevator pitch!',
        conference: 'Your conference registration is confirmed! You\'ll receive your badge and welcome kit at the registration desk. Check your email for the detailed schedule and venue information.'
    };

    return messages[configType] || messages.seminar;
}