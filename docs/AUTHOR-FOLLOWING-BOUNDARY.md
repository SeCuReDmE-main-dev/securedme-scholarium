# Author following boundary

Scholarium supports explicit following of public authors alongside followed topics. It does not use an email address, provider subject, or purchased tier as the social graph key.

## Privacy contract

- A `public_profiles` record maps an internal account to a random opaque public identifier.
- The public feed exposes only this public identifier for an author; it never exposes the provider account ID.
- `user_follows` stores only the follower account, target account, and timestamp.
- An account cannot follow itself; a follow is explicit, reversible, and does not change the target’s reach outside the follower’s own Following feed.

## Feed behavior

The `Following` mode combines two user-chosen inputs: public work from followed authors and public work tagged with followed topics. It remains chronological after that filter. Discovery ranking remains separate and excludes subscriptions, contribution amounts, and paid promotion.
