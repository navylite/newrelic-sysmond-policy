#!/usr/bin/env node

var os = require('os'),
    async = require('async'),
    request = require('request');

var yargs = require('yargs')
                .usage('Adds a server to a NewRelic Server policy via the API.')
                .example('$0 --api-key <newrelic-api-key> --policy My Server Policy --host 123.45.67.89', 'Adds host 123.45.67.89 to policy "My Server Policy"')
                .alias('k', 'api-key')
                .string('k')
                .describe('k', 'NewRelic API Key')
                .demand('k', 'You must specify a NewRelic API key.  See https://docs.newrelic.com/docs/apm/apis/requirements/api-key#creating')
                .alias('p', 'policy')
                .string('p')
                .describe('p', 'NewRelic server policy name')
                .demand('p', 'You must specify a valid Server Monitoring policy name')
                .alias('h', 'host')
                .string('h')
                .describe('h', 'Hostname of server [defaults to local hostname()]')
                .demand('h', 'You must specify a valid hostname')
                .default('h', os.hostname())
                .argv;

function alertOnStatus(code, cb) {
    switch (code) {
        case 401: cb(new Error("Invalid or missing NewRelic API code"));
        case 403: cb(new Error("New Relic API access has not been enabled for your account"));
        case 404: cb(new Error("No alert policy found with the given ID"));
        case 422: cb(new Error("Validation error occurred when updating the alert policy"));
        case 500: cb(new Error("A server error occured, please contact New Relic support"));
        default: cb(new Error("Unknown response code " + code));
    }
}

function getNRServerIdByName(key, name, cb) {
    request(
        {
            url: "https://api.newrelic.com/v2/servers.json?filter[name]=" + name.replace(/\s/,'+','g'),
            headers: {
                "X-Api-Key": key
            },
            json: true
        },
        function(err, response, body) {
            if (response.statusCode != 200) {
                alertOnStatus(response.statusCode, cb);
                return;
            }
            if (body && body.servers && body.servers[0]) {
                body.servers = body.servers.filter(function(server) {return server.host == name});
                if (body.servers.length == 1)
                    cb(null, {id: body.servers[0].id});
                else
                    cb(new Error("Received " + body.servers.length + " servers, while expecting exactly 1"));
            } else
                cb(new Error("Unknown server: " + name));
        }
    );
}



function getNRPolicyIdByName(key, name, cb) {
    request(
        {
            url: "https://api.newrelic.com/v2/alert_policies.json?filter[type]=server&filter[name]=" + name.replace(/\s/,'+','g'),
            headers: {
                "X-Api-Key": key
            },
            json: true
        },
        function(err, response, body) {
            if (response.statusCode != 200) {
                alertOnStatus(response.statusCode, cb);
                return;
            }
            if (body && body.alert_policies && body.alert_policies[0]) {
                body.alert_policies = body.alert_policies.filter(function(policy) {return policy.name == name});
                if (body.alert_policies.length == 1)
                    cb(null, {id: body.alert_policies[0].id, servers: body.alert_policies[0].links.servers});
                else
                    cb(new Error("Received " + body.alert_policies.length + " policies, while expecting exactly 1"));
            } else
                cb(new Error("Unknown policy: " + name));
        }
    );
}

function setNRPolicyServers(key, policy_id, servers, cb) {
    var body = {alert_policy:{links:{servers:servers}}};
    request(
        {
            url: "https://api.newrelic.com/v2/alert_policies/" + policy_id + ".json",
            headers: {
                "X-Api-Key": key
            },
            method: "PUT",
            json: body
        },
        function(err, response, body) {
            if (response.statusCode != 200) {
                alertOnStatus(response.statusCode, cb);
                return;
            }
            if (body && body.alert_policy && body.alert_policy.id == policy_id)
                cb(null);
            else
                cb(new Error("Unknown error adding server to policy: " + body));
        }
    );
}



async.parallel({
    server: async.apply(getNRServerIdByName, yargs['api-key'], yargs['host']),
    policy: async.apply(getNRPolicyIdByName, yargs['api-key'], yargs['policy']),
}, function(err, res) {
    if (err) {
        console.error(err);
        return;
    }
    if (res.policy.servers.indexOf(res.server.id) == -1) {
        res.policy.servers.push(res.server.id);
        setNRPolicyServers(yargs['api-key'], res.policy.id, res.policy.servers, function(err) {
            if (err) console.error(err)
            else console.log("[OK] Server " + yargs['host'] + " added to policy " + yargs['policy']);
        });
    }
    else
        console.log("[OK] Server " + yargs['host'] + " already in policy " + yargs['policy'])
});
