// 引入 console 模块中的 log 方法
import { log } from "console";
// 引入自定义模块中的 getTableShortName 方法
import { getTableShortName } from "./util";
import { QueryModel, ColumnModel, RelationTableModel, JoinModel, ConditionModel, Operator, LikeMatchType, ConditionGenerator, generateSql } from "./type/model/queryModel"

// 引入 bizObjects.json 文件中的数据
let bizObjects: any;
bizObjects = require("./data/bizObjects.json");
// 将 bizObjects.resp_data 赋值给 tableDatas
const tableDatas = bizObjects.resp_data as tableData[];

// 输出 tableDatas 的长度
console.log("datasNum:", tableDatas.length);

// 创建 tableDataMap 和 columnDataMap 两个 Map 对象
const tableDataMap = new Map<string, tableData>();
const columnDataMap = new Map<string, columnData>();

// 遍历 tableDatas 数组
tableDatas.forEach((data) => {
  // 将 data 对象添加到 tableDataMap 中
  tableDataMap.set(data.objectcode, data);
  // 遍历 data.properties 数组
  data.properties.forEach((columnData) => {
    // 将 columnData 对象添加到 columnDataMap 中
    columnDataMap.set(columnData.propertycode, columnData);
  });
});
//init cache end

// 引入客户详情查询.json 文件中的数据
const protocol = require("./flyProtocol/促销列表.json") as protocol
// const protocol = require("./flyProtocol/客户详情查询.json");

// 输出 protocol.functionname
console.log("functionname:", protocol.functionname);


// 将 query 对象转换为 Map 对象
const queryArgumentArrayMap = new Map<string, string[]>();
protocol.input.forEach((input) => {
  const arg = input.properties.map(p => p.name)
  queryArgumentArrayMap.set(input.name, arg);
})

// 定义 fquery 变量
let fquery = "";

// 获取主表名
const mainTableName = protocol.input[0].name;
const columnModelArray = new Array<ColumnModel>()
const conditionModelArray = new Array<ConditionModel>()
const joinModelArray = new Array<JoinModel>()
const queryModel: QueryModel = {
  tableName: mainTableName,
  tableShortName: getTableShortName(mainTableName),
  columns: columnModelArray,
  conditions: conditionModelArray,
  joins: joinModelArray
}

// 将 "select" 添加到 fquery 中
fquery += "select\n{{selectColumns}}";

function genQuery(output: Output, queryModel?: QueryModel): QueryModel {

  // 创建 relationTableColumnMap 和 outPropertiesCodes 两个 Map 对象
  const relationTableColumnMap = new Map<string, string>();
  // const relationTableColumnNameSet = new Set<string>();
  const outPropertiesCodes = output.properties.map((data) => {
    // 如果 data.name 中包含 "__"(关联查询实体)，则将 data.propertycode 和 data.name 添加到 relationTableColumnMap 中
    if (data.name.indexOf("__") !== -1) {
      relationTableColumnMap.set(data.propertycode, data.name);
    }
    return data.propertycode;
  });

  // 获取 output 对应的表格数据
  const outputTable = tableDataMap.get(output.objectcode);
  // 创建 relationTableMap 和 outPropertiesDataMap 两个 Map 对象
  const relationTableMap = new Map<string, tableData>();
  const outPropertiesDataMap = outPropertiesCodes.map((code) => {
    const columnData = columnDataMap.get(code);
    // 如果 columnData 中包含 relationobjectcode 属性，则将 relationTableMap 中添加对应的表格数据
    if (columnData.hasOwnProperty("relationobjectcode")) {
      if (columnData.relationobjectcode > 0 && columnData.propertytypecode != "1000000000") {
        // if (columnData.columnname.indexOf("__") != -1) {
        const relationobjectcode = columnData.relationobjectcode;
        const relationTable = tableDataMap.get(relationobjectcode);
        relationTableMap.set(columnData.columnname, relationTable);
        // }
      }
    }
    return columnData;
  });

  // 获取表格的短名称
  const tableShortName = getTableShortName(outputTable.tablename);
  // 将 outPropertiesDataMap 中的数据添加到 fquery 中


  fquery += `\n  from ${outputTable.tablename} as ${tableShortName}`;


  // 遍历 relationTableMap，将关联表格的数据添加到 fquery 中

  const relationTableShortNameMap = new Map<string, string>();
  const relationTableShortNameReverseMapReverse = new Map<string, string>();
  // console.log("relationTableMap", relationTableMap)
  // relationTableMap.entries()
  // 输出所有key-value对
  relationTableMap.forEach((relationTable, columnname) => {
    // console.log("relationTable", relationTable)
    // console.log("columnname", columnname)
    let tableName = relationTable.tablename
    if (tableName === "pl_dictionary" || tableName === "pl_orgstruct" || tableName === "pl_region") {
      tableName = relationTable.objectmark
    }
    let relationTableShortName = getTableShortName(tableName, columnname);

    // 如果短表明重复，则重新生成
    let seq = 1;
    while (relationTableShortNameReverseMapReverse.get(relationTableShortName) != undefined) {
      relationTableShortName = getTableShortName(tableName, columnname, seq);
      seq++
    }

    relationTableShortNameMap.set(columnname, relationTableShortName);
    relationTableShortNameReverseMapReverse.set(relationTableShortName, tableName);
    let idField = {
      pl_dictionary: "dictionaryid",
      pl_orgstruct: "orgstructid",
      pl_region: "regionid",
    }[relationTable.tablename] || true;
    // 遍历 relationTable.properties 数组
    if (idField) {
      for (const columnData of relationTable.properties) {
        if (columnData.propertytypecode == "1") {
          idField = columnData.columnname;
          break; // 找到后提前结束循环
        }
      }
    }
    const joinModel: JoinModel = {
      tableName: tableShortName,
      tableShortName: tableShortName,
      relationTable: {
        name: relationTable.tablename,
        shortName: relationTableShortName,
        idField: idField,
      },
      columnName: columnname,
    };
    joinModelArray.push(joinModel)
    fquery += `\n  left join ${relationTable.tablename} as ${relationTableShortName} `;
    fquery += `on ${tableShortName}.${columnname} = ${relationTableShortName}.${idField}`;
  });

  log("relationTableShortNameMap----", relationTableShortNameMap)
  log(relationTableShortNameReverseMapReverse)
  // 查询列
  let selectColumns = outPropertiesDataMap
    .map((data) => {
      console.log("data",data)//todo
      const queryname = relationTableColumnMap.get(data.propertycode);
      console.log("relationTableShortNameMap",relationTableShortNameMap.get(queryname))
      relationTableShortNameMap.get(queryname)
      if (queryname === undefined) {
        const columnModel: ColumnModel = {
          tableShortName: tableShortName,
          columnName: data.columnname,
        }
        columnModelArray.push(columnModel)
        return `  ${tableShortName}.${data.columnname}`;
      } else {
        const [relationTableName, relationColumnName] = queryname.split("__");
        log("queryname", queryname)
        const relationTableShortName = relationTableShortNameMap.get(relationTableName);
        const columnModel: ColumnModel = {
          tableShortName: relationTableShortName,
          columnName: relationColumnName,
          queryName: queryname,
          relationTable: {//todo 
            name: relationTableName,
            shortName: '',
            idField: '',
          }
        }
        columnModelArray.push(columnModel)
        return `  ${relationTableShortName}.${relationColumnName} as ${queryname}`;
      }
    })
    .join(",\n");

  fquery = fquery.replace("{{selectColumns}}", selectColumns);

  // 如果 query 不为 null，则将查询条件添加到 fquery 中
  if (queryArgumentArrayMap.size > 0) {
    fquery += "\n  where 1=1\n";
  }

  // 定义模板字符串
  const template = `{#if {{if}}}\n and {{condition}}\n{#endif}\n`;
  // 遍历 queryMap，将查询条件添加到 fquery 中
  queryArgumentArrayMap.forEach((queryArgNameArry, tableName) => {
    if (tableName === mainTableName) {
      queryArgNameArry.forEach((argName) => {
        // 先完成 = 操作
        const conditionModel: ConditionModel = {
          tableName: tableName,
          tableShortName: tableShortName,
          columnName: argName,
          operator: Operator.Equal,
          value: null,
          secondValue: null,
          like: null
        }
        conditionModelArray.push(conditionModel)
        const condition = `${tableShortName}.${argName} = { IN.${tableName}.${argName} }`;
        const q = template.replace(
          "{{if}}",
          `!String.isBlank(IN.${tableName}.${argName})`
        ).replace("{{condition}}", condition);
        fquery += q;
      });
    } else {
      queryArgNameArry.forEach((argName) => {
        const conditionModel: ConditionModel = {
          tableName: tableName,
          tableShortName: relationTableShortNameMap.get(tableName),
          columnName: argName,
          operator: Operator.Equal,
          value: null,
          secondValue: null,
          like: null
        }
        conditionModelArray.push(conditionModel)
        const condition = `${relationTableShortNameMap.get(tableName)}.${argName} = { IN.${tableName}.${argName} }`;
        const q = template.replace(
          "{{if}}",
          `!String.isBlank(IN.${tableName}.${argName})`
        ).replace("{{condition}}", condition);
        fquery += q;
      });
    }
    log(fquery)
  });

  queryModel.columns = columnModelArray
  queryModel.joins = joinModelArray
  queryModel.conditions = conditionModelArray
  return queryModel
}



// 遍历 protocol.output 数组
protocol.output.forEach((output) => {
  genQuery(output, queryModel);
});


console.log(generateSql(queryModel))



