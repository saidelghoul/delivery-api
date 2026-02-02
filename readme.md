**Database**:

<!-- to start the PostgreSQL container in the background: -->

```bash
docker-compose up -d
```

<!-- to visualizes your Data -->

```bash
npx prisma studio
```

<!-- to push Prisma models to the database -->

```bash
npx prisma db push
```

<!-- to migrate -->

```bash
npx prisma migrate
```

<!-- Turns on the existing container (fast). -->

```bash
docker-compose start
```

<!-- Pauses the container when you're done working. -->

```bash
docker-compose stop
```
