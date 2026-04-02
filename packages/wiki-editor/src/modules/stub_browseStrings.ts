import { InteractiveTable, Table } from "cmd-table";
import { readStrings } from "../utils/data";

export default async function stub_browseStrings() {
  const { zhStrings, enStrings } = await readStrings();

  const table = new Table({
    compact: true,
  });
  table.addColumn({ key: "key", name: "key (07C)" });
  table.addColumn({ key: "zh", name: "zh", maxWidth: 40 });
  table.addColumn({ key: "en", name: "en", maxWidth: 40 });
  Object.keys(zhStrings).forEach((key) => {
    if (zhStrings[key]?.trim() || enStrings[key]?.trim()) {
      table.addRow({
        key: key.slice(0, 12),
        zh: zhStrings[key],
        en: enStrings[key],
      });
    }
  });

  const interactive = new InteractiveTable(table);
  interactive.start();
}
