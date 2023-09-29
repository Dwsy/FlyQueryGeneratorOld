export function getTableShortName(tableName: string, relationTableColumnName?: string, seq?) {
  const words = tableName.split("_");
  const firstLetters = words.map((word) => word.charAt(0));
  let name = firstLetters.join("");
  if (seq != undefined) {
    name += seq
  } else {
    if (relationTableColumnName != undefined) {
      name += "_" + relationTableColumnName.slice(0, 3)
    }
  }
  return name;
}
