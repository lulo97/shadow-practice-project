Using popular java 17
Init project by https://start.spring.io/
Run project: 
    mvnw spring-boot:run

Hibernate allow @Entity to have column declare both private and public
- private (most common) = have to manually do get/set (this force encapsulation, entity class control column get/set customly)
- public = get/set build-in like assign object property

Use @Profile() to switch database:
- IUserRepository = normal interface
- Interface SqliteUserRepository extends both JpaRepository, IUserRepository
- Interface SqliteUserRepository decorated with @Profile("sqlite")
- Later I can have PosgresqlUserRepository with @Profile("postgres")
- Change profile in application.properties spring.profiles.active=sqlite

Write select sql with @Repository
- Interface SqliteUserRepository with @Repository extends both JpaRepository, IUserRepository
- Decorate @Query() above any method and write sql

How to auto gen id:
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    -> Make sqlite gen no column type (error)

    @NoLockId
    -> Sqlite don't have sequence so it make db lock

    Solution = Custom class implement IdentifierGenerator (custom gen, make sure number not too big for js)