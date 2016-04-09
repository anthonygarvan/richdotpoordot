# Rich Dot, Poor Dot
## A simulation of the emergence of inequality.

This is a simulation which demonstrates the emergence of systematic inequality from an egalitarian society, given initial disparities in resources and the creation of ownership and trade. It is a live, public, open source version of the model described in [The Emergence of Inequality in Small-Scale Societies: Simple Scenarios and Agent-Based Simulations](http://faculty.washington.edu/easmith/Smith&ChoiMs-May06.pdf).

The simulation depicts a world of randomly distributed resources (greener = richer) spread across a 10x10 map. At first, one dot is placed in each square. Every year there is some probability that they reproduce, die, or change survival strategies. A dot's reproduction rate is proportional to it's income, and mortality rate is inversely proportional to its income.

### Survival strategies
There are four strategies:
- Dove: At first, every dot is a dove. Dove share their resources with others.
- Solo: Solo agents spend some money to defend their patch, preventing other dots from residing on it.
- Client: Clients share the resources of their patch like dove, but they also trade in some of their bounty with a patron for a profit.
- Patron: Patrons defend their territories like Solo types, but also trade their resources with Clients. A patron can have many clients, although each client can only have one patron.

### Nitty Gritty
For full details, see the paper and compare it to my source code. I did not knowingly deviate from the paper, with the exceptions that I chose I higher trade value by default, so that simulations would reliably results in patron-client scenario for incoming users, and I chose to stop the simulation after 500 iterations (vs 2000), which I found to be sufficient in the majority of cases for the qualitative results this app demonstrates.