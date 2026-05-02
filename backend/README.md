# Backend Setup

## PostgreSQL Local Setup

Create the local database and user:

```sql
CREATE DATABASE learnova_db;

CREATE USER learnova_user WITH PASSWORD 'learnova_password';

GRANT ALL PRIVILEGES ON DATABASE learnova_db TO learnova_user;
```
## Run Backend

From the backend directory:

```text
./mvnw spring-boot:run
```

On Windows PowerShell:
```text
.\mvnw spring-boot:run
```

The backend runs by default on:

http://localhost:8080

Swagger UI:

http://localhost:8080/swagger-ui/index.html

If you use local PostgreSQL with your own username/password, run with environment variables instead of changing committed config:

```powershell
$env:DB_URL="jdbc:postgresql://localhost:5432/learnova_db"
$env:DB_USERNAME="your_username"
$env:DB_PASSWORD="your_password"
.\mvnw spring-boot:run
```