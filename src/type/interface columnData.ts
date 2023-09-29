interface columnData {
    propertyname: string;
    relationobjectcode: any;
    defaultvalue: any;
    columnname: string;
    propertydescr: string;
    idxtype: number;
    propertytypecode: string;
    marktype: number;
    publishstatus: number;
    propertycode: string;
    propertycategorycode: string;
    seq: number;
    relationpropertycode: any;
    status: number;
}

interface tableData {
    objectname: string;
    directorytypecode: string;
    parentobjectcode: string;
    objectcode: string;
    marktype: number;
    objectcatgory: number;
    objecttypecode: number;
    publishstatus: number;
    objecttemplatecode: string;
    tablename: string;
    objectmark: string;
    objectdescr: string;
    seq: string;
    diclayer: string;
    properties: columnData[];
    status: number;
}

interface Data {
    resp_data: tableData[];
}

