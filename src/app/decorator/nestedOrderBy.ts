export const nestedOrderBy = (
    orderBy: string,
    order: 'asc' | 'desc' = 'asc',
): Record<string, any> => {
    return orderBy
        .split('.')
        .reverse()
        .reduce((acc, key) => ({ [key]: acc }), order as any);
};
