import { SecretsmanagerSecret } from "@cdktf/provider-aws/lib/secretsmanager-secret";
import { SecretsmanagerSecretVersion } from "@cdktf/provider-aws/lib/secretsmanager-secret-version";
import { Fn, TerraformIterator, TerraformOutput } from "cdktf";
import { Construct } from "constructs";

export type secret = {
    description: string,
    kms_key_id: string,
    policy: string,
    force_overwrite_replica_secret: boolean,
    recovery_window_in_days: number,
    replica_regions: Map<string, string>,
    secret_string: string,
    secret_key_value: Map<string, string>,
};
type GeneralSecretsmanagerConfig = {
    secrets: Map<string, secret>;
};



// const NULL_DEFAULT = "5737fe08-f93f-423a-a912-014377bb78c6";

export class GeneralSecretsmanager extends Construct {
    constructor(
        scope: Construct,
        id: string,
        config: GeneralSecretsmanagerConfig,
    ) {
        super(scope, id);

        const secretsIterator = TerraformIterator.fromMap(config.secrets);

        const aws_secretsmanager_secret = new SecretsmanagerSecret(this, "sm", {
            forEach: secretsIterator,
            name: secretsIterator.key,
            description: secretsIterator.getString("description"),
            kmsKeyId: secretsIterator.getString("kms_key_id"),
            policy: secretsIterator.getString("policy"),
            forceOverwriteReplicaSecret: secretsIterator.getBoolean("force_overwrite_replica_secret"),
            recoveryWindowInDays: secretsIterator.getNumber("recovery_window_in_days"),
        });

        aws_secretsmanager_secret.addOverride("dynamic.replica", {
            for_each: secretsIterator.getMap("replica_regions"),
            content: {
                region: "${replica.key}",
                kms_key_id: "${replica.value}",
            },
        });

        new SecretsmanagerSecretVersion(this, "sm-sv", {
            forEach: secretsIterator,
            secretId: secretsIterator.key,
            secretString: `${secretsIterator.getString("secret_string")}`,
            dependsOn: [aws_secretsmanager_secret],
            lifecycle: {
                ignoreChanges: ["secret_id"]
            }
        });

        new TerraformOutput(this, "arn", {
            value: aws_secretsmanager_secret.getListAttribute("arn"),
        });
    }
}

export class OndaSecretsmanager extends GeneralSecretsmanager {
    constructor(
        scope: Construct,
        id: string,
        config: GeneralSecretsmanagerConfig
    ) {
        super(scope, id, config);

        var secretsMap = new Map<string, secret>();
        config.secrets.forEach((v, k) => {
            secretsMap.set(k, {
                ...v,
            });

        });

        config.secrets = secretsMap;
    }
}