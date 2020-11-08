# Portchain Code Challenge 

This repo contains the solution to PortChain's [code challenge](/CodeChallenge.pdf) as part of their interviewing process.
  
## TL;DR
You can easily run the test with Docker from the command line.
  
Clone the repo:
```
git clone https://github.com/rchavp/Portchain.git && cd Portchain
```
Build the image (this will build the project inside the container and then run the unit tests):
```
docker build -t portchain .
```
Execute the image (this will run the project immediately, print the results on screen and exit):
```
docker run --name portchainins -it --rm portchain
```
**Bonus**: Execute the image as a web site:
```
docker run --name pcinstance -it --rm -e RUNAS='WEB' -p 9876:9876 portchain
# then navigate to http://localhost:9876/
# **NOTE**: I didn't have time to make the results look pretty on web (and css, ux is not my forte)
```
**Bonus2**: You can run the image but just drop into a shell:
```
docker run --name portchainins -it --rm portchain /bin/bash  # then 'cd /deploy' and from there any node commands.
```
# Analisys

The goal's domain lies mainly within data processing and manipulation. We need to gather data from a source and render useful statistics from it. For this reason I decided to start the analysis with a simple conceptual entity diagram. Based on the problem's description I can see 3 major entities as shown below.

![entities](/images/entities.png)

Right away I can see that the data's backbone is the PortCall entity. Each PortCall has one Port and one Vessel associated with it. Vessels and Ports can have multiple PorCalls associated with them. This **1:n** cardinality is pictured in the relationship lines. Finally, Each PortCall can have multiple Log entities associated with it, but not the other way around. Again, a **1:n** relation.  
  
The physical entity model is just slighly different as defined by the data's api entry points. Here, the Vessels can be queried by themselves and PortCalls can only be queried via a specific Vessel, yet the relationship within PortCall->Port remains. This just means that Ports cannot be queried by themselves but only by querying all PortCalls through each Vessel, one at a time, until all Vessels are queried.
  
The PortCalls and LogEntries for each PortCall are separate entities, but are physically combined in the same api call that retrieves the PortCalls per Vessel.
  
Putting all of this together along with the 4 requirements for the test, we can see that this problem is just a matter of aggregating through the PortCall entity though the Vessel entity, and also (separately) through the Port entity. Finally we can also see that the role of the LogEntities is to enhance the PortCall by providing a compound entity for each PortCall, in which this compound entity represents a set of Delays (2,7,14 days) associated with **each** PortCall, as shown bellow:
  
![entities](/images/entities-2.png)

#### Implementation Path
1. To get the complete data set we need to get the list of Vessels and then get all the PortCalls per each Vessel. The PortCall LogEntries are included within the call to each list of PortCalls per Vessel.
2. We need to aggregate the LogEntries per PortCall. As a result, we will have a new PortCall entity without the Logs and just one set cosnisting of 3 Dalay values (2, 7, 14 days)
3. To get the list of visits per Port (5 top and 5 lower), we get the join of PortCall and Port and aggregate it by the count of instances, which represents the number of visits, as each PortCall instance is a visit.
4. To get the Percentiles for each PortCall's duration, we again get the join of PortCall and Port but this time we aggregate by the PortCall's duration to get a list of unique Ports and their respective set that conatins all the visit durations for that Port. Having 1 set of durations per each Port we can then use it as the population sample to calculate the percentiles per each Port.
5. Finally, to get the Percentiles per each Vessel's Delays, we get the join of PortCall and Vessel and then aggregate per Vessel. This renders a list of unique Vessels with 1 set(outer set) containing several Delay sets(inner sets). Each Vessel then has 1 outer set. The inner sets (within the outer set) are just the Delay sets (2, 7, 14 days) we calculated in point #2. Finally, the outer set can be split into 3 outer sets, where each outer set will have one type of Delay (so 1 outer set for 2Days, another for 7Days and a third for 14Ddays). Each outer set then represents a poulation sample (for each Delay type in turn) that can be used to calculate the percentiles, per Vessel.

Notes:
1. PortCalls with "IsOmitted=true" will be filtered out and not considered for the calculations.
2. LogEntries explicitly marked as "IsOmitted=true" will not be considered for the LogEntries aggregations as we **assume** that IsOmitted means that the Log Entry is not applicable.
3. Percentiles are calculated by the greater than or equal rule as decribed [here](https://statisticsbyjim.com/basics/percentiles/).

#### Execution Approach
I decided to apply an iterative process where I will try to achieve something viable as quick as possible and then refactor on each iteration.
1. First I laid down a solution that will just work, but making sure that it is based at least on a minimum set of principles I've learned over the years (the result of this first iteration can be seen in the file **src/simple.ts**).
    * Focus on logic first before performance (unless otherwise specified).
    * Favor declarative statements over imperative ones.
    * Make functions as pure as possible at first.
    * Separate the concerns at a high level.
    * Do not focus on generalizations at first. Only when I need to repeat code more that 2 times I will later consider refactoring it.
    * Make the code readable even if it's not that perfect yet.
    * Make sure to use clear types as much as possible from the get go.
    * Capture exceptions only from the main scope and make sure the rest of exceptions are raised at least. We just need to know if something broke, nothing more.
2. Then I iterated over the first solution focusing on:
    * Separate functions and types into their own modules. Not only because of tidyness but also to hide any local scope setup that belongs only to those modules (for example utility functions and closure scoped variables that need not be exposed in the main scope)
    * Look for any imperative declaration that could be refactored into a declarative one (for ex try to use reduce, map, filter and other applicative constructs instead of plain for, while, or even functions that will end up being analogous).
    * Separate functions that deal with more than one concern into as many as necessary.
    * Try to make as much functions as possible pure (ideally all functions outside the main scope at least).
    * Once functions are more atomic, make sure they are covered by unit tests.
    * Identify the domains and bottom conditions of the pure functions and add a unit tests accordingly (if possible).
    * Enhance exception handling to be comprehensive and to fit within the logic flow, logging, healthchecks, etc.
3. Finally, I ran the tests and the whole project. Only after that then I focused on performance improvements. If there is an obvious performance issue I will address it here:
    * Performancewise the only bottleneck that I decided to fix was the concurrency of the api calls. Not all of them have to run sequencially, in fact, each api call per vessel can run independently from each other asynchronously. For this purpose I used a simple Promise.all to trigger all api calls at once and then waited for all of them to be resolved. A potential problem arises whereby now we may have too many api calls at the same time. We can remediate this by using a library to pool the amount of promises that can run at any given time, hence making sure we have a sensible number. However I didn't have time to properly hook up this.
For this particular test I didn't do much more as I didn't feel the performance was bad at all. However, for a real life project, I **will definitely** consider all external systems that would be linked to this, as well as running environments, runtimes, etc. Only then, and coupled with sensible guidelines (peferably benchmarks or any empiric metrics) I will then consider refactoring the code to accomodate for performance. Refactoring good and readable code for performance is a noble task that can also backfire. And this may not be avoidable. However I consider it as having a tendency to create technical debt as well as increasing the maintenance load, so I'm mindful about it.

---

**Final note**: *I made my best to adhere by the goals and constraints of the test as it was described. However, I need to point out that unlike some project that I will do in real life, the challenge presented here may have a slighly different tint to my usual work.  
What I mean by this is that in this exercise the* **journey** *is as important as the* **goal**, *because this is a showcase of not only me achieving a goal that would make me proud based on requirements, along with normal side tasks like simple docs and such. For this test I* **also** *needed to make sure to leave breadcrumbs and empirical evidence that under normal circumstances I would not consider adding in as they may be overkill or too academic (for example the length and the nature of this entire README).  
In short, some of the things I did (and even some I didn't) were meant to help you assess my test, but these decisions may have been a bit different if this had been a real life problem with a very well defined surrounding context.*