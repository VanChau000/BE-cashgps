insert into "plans" ("planId", name, recurring, price, description)
	select 'price_1M6rEpCxwaFqJ7ikN85pN7yd', 
			'Monthly Starter', 
			'MONTHLY', 
			5, 
			'01 project only, No sharing feature, 01 group cash in, 01 group cash out, 03 categories each group, Unlimited transactions'
	where not exists (select * from plans where "planId"='price_1M6rEpCxwaFqJ7ikN85pN7yd');

	
insert into "plans" ("planId", name, recurring, price, description)
	select 'price_1M6rHQCxwaFqJ7ik5pof4Eec', 
			'Monthly Basic', 
			'MONTHLY', 
			10, 
			'01 project only, No sharing feature, Unlimited groups cash in, Unlimited groups cash out, Unlimited categories'
	where not exists (select * from plans where "planId"='price_1M6rHQCxwaFqJ7ik5pof4Eec');


insert into "plans" ("planId", name, recurring, price, description)
	select 'price_1M6rJjCxwaFqJ7ikWOByTWsq', 
			'Monthly Medium', 
			'MONTHLY', 
			15, 
			'02 projects, Sharing feature limit 5 people, Unlimited groups cash in, Unlimited groups cash out, Unlimited categories'
	where not exists (select * from plans where "planId"='price_1M6rJjCxwaFqJ7ikWOByTWsq');



insert into "plans" ("planId", name, recurring, price, description)
	select 'price_1M6rNZCxwaFqJ7ikZDUoSHbp', 
			'Monthly Premium', 
			'MONTHLY', 
			25, 
			'Unlimited projects, Sharing feature (without fee), Unlimited groups cash in, Unlimited groups cash out, Unlimited categories'
	where not exists (select * from plans where "planId"='price_1M6rNZCxwaFqJ7ikZDUoSHbp');

	
	
insert into "plans" ("planId", name, recurring, price, description)
	select 'price_1M6rasCxwaFqJ7ikewYQCb75', 
			'Annually Starter', 
			'YEARLY', 
			59, 
			'01 project only, No sharing feature, 01 group cash in, 01 group cash out, 03 categories each group, Unlimited transactions'
	where not exists (select * from plans where "planId"='price_1M6rasCxwaFqJ7ikewYQCb75');


insert into "plans" ("planId", name, recurring, price, description)
	select 'price_1M6rc3CxwaFqJ7ikz72tWs1i', 
			'Annually Basic', 
			'YEARLY', 
			110, 
			'01 project only, No sharing feature, Unlimited groups cash in, Unlimited groups cash out, Unlimited categories'
	where not exists (select * from plans where "planId"='price_1M6rc3CxwaFqJ7ikz72tWs1i');

	

insert into "plans" ("planId", name, recurring, price, description)
	select 'price_1M6rcnCxwaFqJ7ik7FM27nys', 
			'Annually Medium', 
			'YEARLY', 
			160, 
			'02 projects, Sharing feature limit 5 people, Unlimited groups cash in, Unlimited groups cash out, Unlimited categories'
	where not exists (select * from plans where "planId"='price_1M6rcnCxwaFqJ7ik7FM27nys');


insert into "plans" ("planId", name, recurring, price, description)
	select 'price_1M6rdLCxwaFqJ7ikEgNpMIc2', 
			'Annually Premium', 
			'YEARLY', 
			270, 
			'Unlimited projects, Sharing feature (without fee), Unlimited groups cash in, Unlimited groups cash out, Unlimited categories'
	where not exists (select * from plans where "planId"='price_1M6rdLCxwaFqJ7ikEgNpMIc2');
