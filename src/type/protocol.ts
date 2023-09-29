interface Templateparams {
  flycode: string;
}

interface Operations {
  templateref: string;
  modellogicstepname: string;
  marktype: string;
  modellogiccode: string;
  modellogicstepcode: string;
  seq: number;
  status: string;
  templateparams: Templateparams;
}

interface Properties {
  name: string;
  propertyname: string;
  propertytypecode: string;
  objectcode: string;
  propertycode: string;
  marktype: string;
}

interface Input {
  name: string;
  objectcode: string;
  objectname: string;
  datatype: string;
  marktype: string;
  properties: Properties[];
}

interface Properties {
  name: string;
  propertyname: string;
  propertytypecode: string;
  objectcode: string;
  propertycode: string;
  marktype: string;
}

interface Output {
  name: string;
  objectcode: string;
  objectname: string;
  datatype: string;
  marktype: string;
  properties: Properties[];
}

interface protocol {
  modellogicname: string;
  execmode: string;
  status: string;
  actiontype: string;
  modelcode: string;
  actioncategory: string;
  usedatarule: string;
  functionname: string;
  tenantdbtype: string;
  tenantdbcode: string;
  tenantdbname: string;
  operations: Operations;
  modellogiccode: string;
  marktype: string;
  input: Input[];
  output: Output[];
  logicscript: string;
  uilogicscript: string;
  message: any;
}
