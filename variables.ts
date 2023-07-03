import { Fn, TerraformVariable, TerraformVariableConfig, VariableType } from "cdktf";
import { Construct } from "constructs";

export class Tfvars extends Construct {
    public googleCloudOAuth2CredentialSecretString: string;
    public defaultRegion: string;
    constructor(
        scope: Construct,
        name: string,
    ) {
        super(scope, name);

        this.defaultRegion = "us-east-1";

        this.googleCloudOAuth2CredentialSecretString = Fn.jsonencode(new IdOverrideVariable(this, "GoogleCloudOAuth2CredentialSecretPair", {
            type: VariableType.object({
                client_id: VariableType.STRING,
                secret_key: VariableType.STRING,
            }),
            sensitive: true,
            description: "Client_id and Secret_key pair for the GoogleCloudOAuth2Credential"
        }).value);
    }
}

// If we don't override the logical id of the TerraformVariable we will end up with a layered id with unique hash suffix
// Ex. main_google_cloud_cred_700J5K instead of google_cloud_cred 
// Replacing the layered id and unique suffix makes the variable id appear as though it was generated in our main stack, 
// ultimately making it easier to reference
class IdOverrideVariable extends TerraformVariable {
    constructor(
        scope: Construct,
        id: string,
        config: TerraformVariableConfig
    ) {
        super(scope, id, config);

        this.overrideLogicalId(id);
    }
}