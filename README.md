<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://coveralls.io/github/nestjs/nest?branch=master" target="_blank"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#9" alt="Coverage" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://kamilmysliwiec.com)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](LICENSE).

## BACKUP DB

```sh
# Run this on your server
docker exec prod_followers_bicara_postgre \
  pg_dump -U followersBicaraDong -d postgres > backup_postgres_followerbicara_$(date +"%Y%m%d").sql
```

## RESTORE DB

```sh
docker exec -i prod_followers_bicara_postgre \
  psql -U followersBicaraDong -d postgres < backup_postgres_followerbicara_20250809.sql
```

## BACKUP FILES

```sh
docker run --rm \
  -v prod_volume_api_followers:/source \
  -v $(pwd):/backup \
  alpine tar czf /backup/public_files_followersbicara_$(date +"%Y%m%d").tar.gz -C /source .
```

## RESTORE FILES

```sh
docker run --rm \
  -v prod_volume_api_followers:/target \
  -v $(pwd):/backup \
  alpine tar xzf /backup/public_files_followersbicara_20250809.tar.gz -C /target

```

## STAGING DEPLOYMENT

### Overview
The staging environment allows you to test changes against real production data without affecting the live system. The staging docker-compose automatically backs up and copies production volumes on startup for maximum safety.

### Quick Setup
```sh
# Deploy staging with production data (one command!)
./deploy-staging.sh
```

### Manual Setup
```sh
# Stop existing staging
docker-compose -f docker-compose-staging.yml down --volumes

# Start staging (automatically copies production data)
docker-compose -f docker-compose-staging.yml up -d
```

### Staging URLs
- **API**: http://localhost:5777
- **Debug/Health**: http://localhost:5888

### Configuration Differences
Staging uses:
- Different ports (5777, 5888 vs production 5333, 5666)
- Different container names (stg-* vs prod-*)
- Different volume names (stg_* vs prod_*)
- Different JWT secret for security isolation
- Same database credentials (isolated by container network)

### Workflow
1. **Copy Production Data**: Use the script to copy current production data to staging
2. **Test Changes**: Deploy and test your changes in staging with real data
3. **Verify**: Ensure everything works as expected
4. **Deploy**: Apply the same changes to production with confidence

### Safety Features
- **Automatic Backups**: Production volumes are backed up before each staging deployment
- **Backup Retention**: Backups are kept for 30 days and automatically cleaned up
- **Fresh Data**: Each deployment gets the latest production data
- **Isolation**: Staging changes don't affect production data
- **No Conflicts**: Different ports (5777, 5888) avoid production conflicts

### Backup Files
Automatic backups are stored in `./backups/` with timestamped filenames:
- `prod_files_backup_YYYYMMDD_HHMMSS.tar.gz`
- `prod_db_backup_YYYYMMDD_HHMMSS.tar.gz`
