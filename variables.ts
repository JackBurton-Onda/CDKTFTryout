import * as cdktf from "cdktf";
import { Construct } from "constructs";
import { secret } from "./secretsmanager/secretsmanager";

export class Tfvars extends Construct {
    public defaultRegion: string;
    public oAuthTokens: Map<string, secret>;
    constructor(
        scope: Construct,
        name: string,
    ) {
        super(scope, name);

        this.defaultRegion = new cdktf.TerraformVariable(this, "default_region", {
            type: cdktf.VariableType.STRING,
            default: "us-east-1",
            description: "Default AWS region to apply to"
        }).value;

        this.oAuthTokens = new cdktf.TerraformVariable(this, "O_Auth_Tokens", {
            type: cdktf.VariableType.map(cdktf.VariableType.ANY)
        }).value;
    }
}