# Unfair Dots
## Explore a peer-reviewed model of the emergence of inequality from simple assumptions

This is simulation which demonstrates the emergence of systematic inequality from an egalitarian society, given initial disparities in resources and mutations in survival strategy. It is a live, public, open source version of the model described in [THE EMERGENCE OF INEQUALITY IN SMALL-SCALE SOCIETIES:
SIMPLE SCENARIOS AND AGENT-BASED SIMULATIONS](http://faculty.washington.edu/easmith/Smith&ChoiMs-May06.pdf).

The simulation depicts a world of randomly distributed resources (greener = richer) spread across a 10x10 map. At first, one dot is placed in each square. Every year there is some probability that they reproduce, die, or change survival strategies. What dynamics from varying different scenarios?

### Survival strategies
There are four strategies:
- Dove: At first, every dot is a dove. Dove share their resources with others.
- Solo: Solo agents spend some money to defend their patch, preventing other dots from residing on it.
- Client: Clients share the resources of their patch like dove, but they also trade in some of their bounty with a patron for a profit.
- Patron: Patrons defend their territories like Solo types, but also trade their resources with Clients. A patron can have many clients, although each client can only have one patron.

### Other details
- A dot's reproduction rate is proportional to it's income, and mortality rate is inversely proportional to its income. 