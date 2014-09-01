# newrelic-sysmond-policy

Helper utility to assign a server to a particular server policy at NewRelic

You'll need an API key - [read more](https://docs.newrelic.com/docs/apm/apis/requirements/api-key#creating)

## Usage

### Synopsis

```bash
$ newrelic-sysmond-policy --policy Default server policy --api-key <newrelic-api-key>
```

Adds the local computer to NewRelic "Default server policy" policy

### Options

* -k / --api-key __required__ Your [NewRelic API key](https://docs.newrelic.com/docs/apm/apis/requirements/api-key#creating)
* -p / --policy __required__ The *name* of the NewRelic server policy.  This policy must already be created in your account
* -h / --host __optional__ **defaults to the value of hostname()** The hostname to move to the new policy

Note that you do not need to add to one policy and remove from another - NewRelic assigns each server to exactly one policy, so this will move the server to the new policy

## License

Copyright 2014 Issac Goldstand <margol@beamartyr.net>

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.



