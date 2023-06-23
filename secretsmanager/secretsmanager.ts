import { SecretsmanagerSecret } from "@cdktf/provider-aws/lib/secretsmanager-secret";
import { SecretsmanagerSecretVersion } from "@cdktf/provider-aws/lib/secretsmanager-secret-version";
import { Fn, Op, TerraformIterator, Token, conditional } from "cdktf";
import { Construct } from "constructs";

type secret = {
    description: string,
    kms_key_id: string,
    name_prefix: string,
    policy: string,
    recover_window_id_days: number,
    replica_regions: Map<string, string>,
    secret_string: string,
    secret_key_value: Map<string, string>,
};
type GeneralSecretsmanagerConfig = {
    secrets: Map<string, secret>;
};

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
            name: `${conditional(Op.eq(Fn.lookup(secretsIterator.value, "name_prefix", Token.nullValue()), Token.nullValue()), secretsIterator.key, Token.nullValue())}`,
        });

        new SecretsmanagerSecretVersion(this, "sm-sv", {
            forEach: secretsIterator,
            secretId: secretsIterator.key,
            secretString: `${Fn.lookup(secretsIterator.value, "secret_string", null)}`,
            dependsOn: [aws_secretsmanager_secret],
            lifecycle: {
                ignoreChanges: ["secret_id"]
            }
        });
    }
}