export interface QueryModel {
    tableName: string
    tableShortName: string
    columns: ColumnModel[]
    conditions: ConditionModel[]
    joins: JoinModel[]
}




export interface ColumnModel {
    columnName: string
    tableShortName: string
    queryName?: string,
    relationTable?: RelationTableModel
}


export interface RelationTableModel {
    name: string
    shortName: string
    idField: string | boolean
}

export interface JoinModel {
    tableName: string
    tableShortName: string
    relationTable: {
        name: string
        shortName: string
        idField: string | boolean
    }
    columnName: string
}


export interface ConditionModel {
    tableName: string
    tableShortName: string
    columnName: string
    operator: Operator
    value?: string
    secondValue?: string
    like?: {
        matchType: LikeMatchType
    }
}

export enum Operator {
    Equal = "=",
    NotEqual = "<>",
    GreaterThan = ">",
    GreaterThanOrEqual = ">=",
    LessThan = "<",
    LessThanOrEqual = "<=",
    Between = "BETWEEN",
    NotBetween = "NOT BETWEEN",
}


export enum LikeMatchType {
    StartsWith = "StartsWith",
    EndsWith = "EndsWith",
    Contains = "Contains",
}

export class ConditionGenerator {
    private condition: ConditionModel;

    constructor(condition: ConditionModel) {
        this.condition = condition;
    }

    public generateEqualClause(): string {
        return `${this.condition.tableShortName}.${this.condition.columnName} = {IN.${this.condition.tableName}.${this.condition.columnName}}`;
    }

    public generateNotEqualClause(): string {
        return `${this.condition.tableShortName}.${this.condition.columnName} <> {IN.${this.condition.tableName}.${this.condition.columnName}}`;
    }

    public generateGreaterThanClause(): string {
        return `${this.condition.tableShortName}.${this.condition.columnName} > {IN.${this.condition.tableName}.${this.condition.columnName}}`;
    }

    public generateGreaterThanOrEqualClause(): string {
        return `${this.condition.tableShortName}.${this.condition.columnName} >= {IN.${this.condition.tableName}.${this.condition.columnName}}`;
    }

    public generateLessThanClause(): string {
        return `${this.condition.tableShortName}.${this.condition.columnName} < {IN.${this.condition.tableName}.${this.condition.columnName}}`;
    }

    public generateLessThanOrEqualClause(): string {
        return `${this.condition.tableShortName}.${this.condition.columnName} <= {IN.${this.condition.tableName}.${this.condition.columnName}}`;
    }

    public generateBetweenClause(): string {
        return `${this.condition.tableShortName}.${this.condition.columnName} BETWEEN ${this.condition.value} AND ${this.condition.secondValue}`;
    }

    public generateNotBetweenClause(): string {
        return `${this.condition.tableShortName}.${this.condition.columnName} NOT BETWEEN ${this.condition.value} AND ${this.condition.secondValue}`;
    }

    public generateLikeClause(): string {
        const value = this.condition.value;
        const matchType = this.condition.like.matchType;
        let likeValue: string
        if (matchType === LikeMatchType.Contains) {
            likeValue = `%${value}%`;
        } else if (matchType === LikeMatchType.StartsWith) {
            likeValue = `${value}%`;
        } else if (matchType === LikeMatchType.EndsWith) {
            likeValue = `%${value}`;
        }
        return `${this.condition.tableShortName}.${this.condition.columnName} LIKE '${likeValue}'`;
    }
    public generateWhereClause(): string {
        let clause = "";
        switch (this.condition.operator) {
            case Operator.Equal:
                clause = this.generateEqualClause();
                break;
            case Operator.NotEqual:
                clause = this.generateNotEqualClause();
                break;
            case Operator.GreaterThan:
                clause = this.generateGreaterThanClause();
                break;
            case Operator.GreaterThanOrEqual:
                clause = this.generateGreaterThanOrEqualClause();
                break;
            case Operator.LessThan:
                clause = this.generateLessThanClause();
                break;
            case Operator.LessThanOrEqual:
                clause = this.generateLessThanOrEqualClause();
                break;
            case Operator.Between:
                clause = this.generateBetweenClause();
                break;
            case Operator.NotBetween:
                clause = this.generateNotBetweenClause();
                break;
            default:
                break;
        }
        return clause;
    }
}


export function generateSql(queryModel: QueryModel): string {
    // 生成 SELECT 子句
    const selectClause = `SELECT\n  ${queryModel.columns.map((c) => {
        if (c.queryName == null || c.queryName == undefined) {
            console.log("log11",c)
            return `${c.tableShortName}.${c.columnName}`
        } else {
            console.log("log",c)
            return `${c.tableShortName}.${c.columnName} as ${c.queryName}`
        }
    }).join(",\n  ")}`;

    // 生成 FROM 子句
    const fromClause = `FROM\n  ${queryModel.tableName} as ${queryModel.tableShortName}`;

    // 生成 JOIN 子句
    const joinClauses = queryModel.joins.map((j) => {
        let lj: string
        let on: string
        if (j.relationTable.name != null || j.relationTable.name != undefined) {
            lj = `LEFT JOIN ${j.relationTable.name} as ${j.relationTable.shortName} `
            on = `ON ${j.relationTable.shortName}.${j.relationTable.idField} = ${j.tableShortName}.${j.columnName}`
        } else {
            lj = `LEFT JOIN ${j.relationTable.name} as ${j.relationTable.shortName} `
            on = `ON ${j.relationTable.name}.${j.columnName} = ${j.tableShortName}.${j.columnName}`
        }
        return lj.concat(on)
    });

    // 生成 WHERE 子句
    const whereClauses = queryModel.conditions.map((c) => {
        // 定义模板字符串
        const whereTemplate = `{#if {{if}}}\n and {{condition}}\n{#endif}\n`;

        const juede = `!String.isBlank(IN.${c.tableName}.${c.columnName})`
        const generator = new ConditionGenerator(c);
        const condition = generator.generateWhereClause();

        const where = whereTemplate
            .replace("{{if}}", juede)
            .replace("{{condition}}", condition);
        return where;
    });
    const whereClause = whereClauses.length > 0 ? `WHERE 1=1\n${whereClauses.join("")}` : "";

    // 拼接 SQL 语句
    const sql = `${selectClause}\n${fromClause}\n${joinClauses.join("\n")}\n${whereClause}`;

    return sql;
}
