use sakila2;

--Q1

select * from dbo.film_category --for testing purpose
select * from dbo.rental; --for testing purpose
select * from dbo.category; --for testing purpose
select * from dbo.film; --for testing purpose
select * from store;

select name from dbo.category where category_id in 
( select category_id from dbo.film_category where film_id in
(select film_id from dbo.film where rental_rate in
(select max(rental_rate) from dbo.film )))

--Q2

select * from dbo.customer; --for testing purpose

select * from dbo.inventory; --for testing purpose

select first_name from dbo.customer where customer_id in 
(
select top 1 customer_id
from rental
group by customer_id
order by COUNT(*) DESC
)

--Q3
select c.*, r.* from dbo.customer c join dbo.rental r on c.customer_id = r.customer_id;

--Q4 4. List all films that have been rented more than once by a single customer
select title from dbo.film where film_id in
(select film_id from inventory where inventory_id in
(select inventory_id from rental where customer_id in(
select top 1 customer_id
from rental
group by customer_id
order by COUNT(*) DESC
)))

--Q5
select 
    p.customer_id, 
    c.first_name, 
    c.last_name, 
    sum(p.amount) as total_amount_spent from dbo.payment
	p JOIN dbo.customer c on p.customer_id = c.customer_id 
	group by p.customer_id, c.first_name, c.last_name;


-- Q6. Classify customers based on their total spending into three categories: "Low spender," "Medium spender," and "High spender."

select customer_id , sum(amount) as total_amount_spend,
case
	when sum(amount) < 50
		then 'Low spender'
	when sum(amount) >= 50 and sum(amount) <= 200
		then 'Medium spender'
	when sum(amount) > 200
		then 'High spender'
	end as category

from dbo.payment group by customer_id;

--Q7 Create a view top_customers_per_store that lists the top 3 customers by total payment amount for each store. 
-- Include store ID, customer ID, customer name, total payment amount, and rank.

select * from dbo.store;
select * from customer;

select TOP 3 s.store_id, c.customer_id, c.first_name, c.last_name, p.amount from customer 
c join store s on c.store_id = s.store_id  join dbo.payment p on c.customer_id = p.customer_id
group by s.store_id, c.customer_id, c.first_name, c.last_name, p.amount  
order by p.amount DESC ;

--Q8 Find the customer who rented the most movies in a single month.

select * from customer where customer_id in 
(select customer_id from rental where customer_id in (
select top 1 customer_id
from rental
group by customer_id
order by COUNT(*), customer_id DESC
))


--Q9 9. Write a stored procedure sp_films_never_rented that returns the list of films that were 
-- never rented, including film ID, title, and release year.select film_id , title, release_year from film where rental_rate = Null;select * from film;
--Q10 

select * from customer;

select top 1 c.first_name, r.rental_date, f.title from customer c join rental r on 
c.customer_id = r.customer_id join inventory i on r.inventory_id = i.inventory_id join film f on i.film_id = f.film_id;