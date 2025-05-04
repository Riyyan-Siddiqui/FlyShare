-- drop  DATABASE sakila2
-- Create the database
CREATE DATABASE sakila2;
GO

-- Use the new database
USE sakila2;
GO



CREATE TABLE actor (
    actor_id SMALLINT NOT NULL IDENTITY(1,1),
    first_name VARCHAR(45) NOT NULL,
    last_name VARCHAR(45) NOT NULL,
    last_update DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_actor PRIMARY KEY (actor_id)
);

CREATE NONCLUSTERED INDEX idx_actor_last_name ON actor (last_name);



-- Table structure for table `country`
CREATE TABLE country (
    country_id SMALLINT NOT NULL IDENTITY(1,1),
    country VARCHAR(50) NOT NULL,
    last_update DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_country PRIMARY KEY (country_id)
);


-- Table structure for table `category`
CREATE TABLE category (
    category_id TINYINT NOT NULL IDENTITY(1,1),
    name VARCHAR(25) NOT NULL,
    last_update DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_category PRIMARY KEY (category_id)
);

-- Table structure for table `city`
CREATE TABLE city (
    city_id SMALLINT NOT NULL IDENTITY(1,1),
    city VARCHAR(50) NOT NULL,
    country_id SMALLINT NOT NULL,
    last_update DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_city PRIMARY KEY (city_id),
    CONSTRAINT FK_city_country FOREIGN KEY (country_id)
        REFERENCES country (country_id)
        ON DELETE NO ACTION ON UPDATE CASCADE
);

CREATE NONCLUSTERED INDEX idx_fk_country_id ON city (country_id);


CREATE TABLE address (
    address_id SMALLINT NOT NULL IDENTITY(1,1),
    address VARCHAR(50) NOT NULL,
    address2 VARCHAR(50) NULL,
    district VARCHAR(20) NOT NULL,
    city_id SMALLINT NOT NULL,
    postal_code VARCHAR(10) NULL,
    phone VARCHAR(20) NOT NULL,
    location GEOMETRY NOT NULL,
    last_update DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_address PRIMARY KEY (address_id),
    CONSTRAINT FK_address_city FOREIGN KEY (city_id)
        REFERENCES city (city_id)
        ON DELETE NO ACTION ON UPDATE CASCADE
);

CREATE NONCLUSTERED INDEX idx_fk_city_id ON address (city_id);
-- CREATE SPATIAL INDEX idx_location ON address (location);


-- Table structure for table `language`
CREATE TABLE language (
    language_id TINYINT NOT NULL IDENTITY(1,1),
    name CHAR(20) NOT NULL,
    last_update DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_language PRIMARY KEY (language_id)
);


-- Step 1: Create store without FK to staff
CREATE TABLE store (
    store_id TINYINT NOT NULL IDENTITY(1,1),
    manager_staff_id TINYINT NOT NULL,
    address_id SMALLINT NOT NULL,
    last_update DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_store PRIMARY KEY (store_id)
);

CREATE NONCLUSTERED INDEX idx_fk_address_id_store ON store (address_id);

-- Step 2: Create staff with FK to store
CREATE TABLE staff (
    staff_id TINYINT NOT NULL IDENTITY(1,1),
    first_name VARCHAR(45) NOT NULL,
    last_name VARCHAR(45) NOT NULL,
    address_id SMALLINT NOT NULL,
    picture VARBINARY(MAX) NULL,
    email VARCHAR(50) NULL,
    store_id TINYINT NOT NULL,
    active BIT NOT NULL DEFAULT 1,
    username VARCHAR(16) NOT NULL,
    password VARCHAR(40) COLLATE Latin1_General_BIN NULL,
    last_update DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_staff PRIMARY KEY (staff_id),
    CONSTRAINT FK_staff_address FOREIGN KEY (address_id)
        REFERENCES address (address_id)
        ON DELETE NO ACTION ON UPDATE CASCADE,
    CONSTRAINT FK_staff_store FOREIGN KEY (store_id)
        REFERENCES store (store_id)
        ON DELETE NO ACTION ON UPDATE CASCADE
);

CREATE NONCLUSTERED INDEX idx_fk_store_id_staff ON staff (store_id);
CREATE NONCLUSTERED INDEX idx_fk_address_id_staff ON staff (address_id);

-- Step 3: Add FK from store.manager_staff_id to staff.staff_id
--ALTER TABLE store
--ADD CONSTRAINT FK_store_staff FOREIGN KEY (manager_staff_id)
 --   REFERENCES staff (staff_id)
 --   ON DELETE NO ACTION ON UPDATE NO ACTION;




-- Table structure for table `customer`
CREATE TABLE customer (
    customer_id SMALLINT NOT NULL IDENTITY(1,1),
    store_id TINYINT NOT NULL,
    first_name VARCHAR(45) NOT NULL,
    last_name VARCHAR(45) NOT NULL,
    email VARCHAR(50) NULL,
    address_id SMALLINT NOT NULL,
    active BIT NOT NULL DEFAULT 1,
    create_date DATETIME2 NOT NULL,
    last_update DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_customer PRIMARY KEY (customer_id),
    CONSTRAINT FK_customer_address FOREIGN KEY (address_id)
        REFERENCES address (address_id)
        ON DELETE NO ACTION ON UPDATE CASCADE,
    CONSTRAINT FK_customer_store FOREIGN KEY (store_id)
        REFERENCES store (store_id)
        ON DELETE NO ACTION ON UPDATE NO ACTION
);

CREATE NONCLUSTERED INDEX idx_fk_store_id ON customer (store_id);
CREATE NONCLUSTERED INDEX idx_fk_address_id ON customer (address_id);
CREATE NONCLUSTERED INDEX idx_last_name ON customer (last_name);

-- Table structure for table `film`
CREATE TABLE film (
    film_id SMALLINT NOT NULL IDENTITY(1,1),
    title VARCHAR(128) NOT NULL,
    description TEXT NULL,
    release_year SMALLINT NULL,
    language_id TINYINT NOT NULL,
    original_language_id TINYINT NULL,
    rental_duration TINYINT NOT NULL DEFAULT 3,
    rental_rate DECIMAL(4,2) NOT NULL DEFAULT 4.99,
    length SMALLINT NULL,
    replacement_cost DECIMAL(5,2) NOT NULL DEFAULT 19.99,
    rating VARCHAR(10) DEFAULT 'G',
    special_features VARCHAR(100) NULL,
    last_update DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_film PRIMARY KEY (film_id),
    CONSTRAINT FK_film_language FOREIGN KEY (language_id)
        REFERENCES language (language_id)
        ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT FK_film_language_original FOREIGN KEY (original_language_id)
        REFERENCES language (language_id)
        ON DELETE NO ACTION ON UPDATE NO ACTION
);

CREATE NONCLUSTERED INDEX idx_title ON film (title);
CREATE NONCLUSTERED INDEX idx_fk_language_id ON film (language_id);
CREATE NONCLUSTERED INDEX idx_fk_original_language_id ON film (original_language_id);

-- Table structure for table `film_actor`
CREATE TABLE film_actor (
    actor_id SMALLINT NOT NULL,
    film_id SMALLINT NOT NULL,
    last_update DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_film_actor PRIMARY KEY (actor_id, film_id),
    CONSTRAINT FK_film_actor_actor FOREIGN KEY (actor_id)
        REFERENCES actor (actor_id)
        ON DELETE NO ACTION ON UPDATE CASCADE,
    CONSTRAINT FK_film_actor_film FOREIGN KEY (film_id)
        REFERENCES film (film_id)
        ON DELETE NO ACTION ON UPDATE CASCADE
);

CREATE NONCLUSTERED INDEX idx_fk_film_id ON film_actor (film_id);

-- Table structure for table `film_category`
CREATE TABLE film_category (
    film_id SMALLINT NOT NULL,
    category_id TINYINT NOT NULL,
    last_update DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_film_category PRIMARY KEY (film_id, category_id),
    CONSTRAINT FK_film_category_film FOREIGN KEY (film_id)
        REFERENCES film (film_id)
        ON DELETE NO ACTION ON UPDATE CASCADE,
    CONSTRAINT FK_film_category_category FOREIGN KEY (category_id)
        REFERENCES category (category_id)
        ON DELETE NO ACTION ON UPDATE CASCADE
);



-- Table structure for table `film_text`
CREATE TABLE film_text (
    film_id SMALLINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    CONSTRAINT PK_film_text PRIMARY KEY (film_id)
);

-- CREATE FULLTEXT INDEX idx_title_description ON film_text (title, description);



-- Table structure for table `inventory`
CREATE TABLE inventory (
    inventory_id INT NOT NULL IDENTITY(1,1),
    film_id SMALLINT NOT NULL,
    store_id TINYINT NOT NULL,
    last_update DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_inventory PRIMARY KEY (inventory_id),
    CONSTRAINT FK_inventory_film FOREIGN KEY (film_id)
        REFERENCES film (film_id)
        ON DELETE NO ACTION ON UPDATE CASCADE,
    CONSTRAINT FK_inventory_store FOREIGN KEY (store_id)
        REFERENCES store (store_id)
        ON DELETE NO ACTION ON UPDATE CASCADE
);

CREATE NONCLUSTERED INDEX idx_fk_film_id ON inventory (film_id);
CREATE NONCLUSTERED INDEX idx_store_id_film_id ON inventory (store_id, film_id);


-- Table structure for table `rental`
CREATE TABLE rental (
    rental_id INT NOT NULL IDENTITY(1,1),
    rental_date DATETIME2 NOT NULL,
    inventory_id INT NOT NULL,
    customer_id SMALLINT NOT NULL,
    return_date DATETIME2 NULL,
    staff_id TINYINT NOT NULL,
    last_update DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_rental PRIMARY KEY (rental_id),
    CONSTRAINT UQ_rental UNIQUE (rental_date, inventory_id, customer_id),
    CONSTRAINT FK_rental_inventory FOREIGN KEY (inventory_id)
        REFERENCES inventory (inventory_id)
        ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT FK_rental_customer FOREIGN KEY (customer_id)
        REFERENCES customer (customer_id)
        ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT FK_rental_staff FOREIGN KEY (staff_id)
        REFERENCES staff (staff_id)
        ON DELETE NO ACTION ON UPDATE NO ACTION
);

CREATE NONCLUSTERED INDEX idx_fk_inventory_id ON rental (inventory_id);
CREATE NONCLUSTERED INDEX idx_fk_customer_id ON rental (customer_id);
CREATE NONCLUSTERED INDEX idx_fk_staff_id ON rental (staff_id);


-- Table structure for table `payment`
CREATE TABLE payment (
    payment_id SMALLINT NOT NULL IDENTITY(1,1),
    customer_id SMALLINT NOT NULL,
    staff_id TINYINT NOT NULL,
    rental_id INT NULL,
    amount DECIMAL(5,2) NOT NULL,
    payment_date DATETIME2 NOT NULL,
    last_update DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_payment PRIMARY KEY (payment_id),
    CONSTRAINT FK_payment_customer FOREIGN KEY (customer_id)
        REFERENCES customer (customer_id)
        ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT FK_payment_staff FOREIGN KEY (staff_id)
        REFERENCES staff (staff_id)
        ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT FK_payment_rental FOREIGN KEY (rental_id)
        REFERENCES rental (rental_id)
        ON DELETE SET NULL ON UPDATE NO ACTION
);

CREATE NONCLUSTERED INDEX idx_fk_staff_id ON payment (staff_id);
CREATE NONCLUSTERED INDEX idx_fk_customer_id ON payment (customer_id);




