import z from "zod";

const zTabx = z.object({
  license: z.string().optional(),
  description: z.object({
    zh: z.string(),
    en: z.string(),
  }).optional(),
  sources: z.string().optional(),
  schema: z.object({
    fields: z.array(
      z.object({
        name: z.string(),
        type: z.enum(["string", "number", "boolean"]),
        title: z.object({
          zh: z.string().optional(),
          en: z.string(),
        }),
      }),
    ),
  }),
  data: z.array(
    z.union([z.string(), z.number(), z.boolean(), z.null()]).array(),
  ),
});
type TabxJson = z.infer<typeof zTabx>;

const zTabxInputHeader = z.object({
  key: z.string(),
  type: z.enum(["string", "number", "boolean"]).default("string"),
  isArray: z.boolean().optional(),
});
type TabxInputHeader = z.infer<typeof zTabxInputHeader>;

export class Tabx<T extends Record<string, any>> {
  private _json: TabxJson;

  private constructor(json: TabxJson) {
    this._json = zTabx.parse(json);
  }

  static fromHeaders<T extends Record<string, any>>(headers: TabxInputHeader[]) {
    const headersParsed = zTabxInputHeader.array().parse(headers);
    return new Tabx<T>({
      schema: {
        fields: headersParsed.map((header) => {
          return {
            name: header.key,
            type: header.type,
            title: {
              en: header.isArray ? `${header.key}[]` : header.key,
            },
          };
        }),
      },
      data: [],
    });
  }

  addItem(item: T) {
    if (!this.isValidItem(item)) {
      throw new Error(`Item is not valid: ${JSON.stringify(item)}`);
    }
    this._json.data.push(this._getRowByItem(item));
  }

  addItems(items: T[]) {
    items.forEach((item) => {
      this.addItem(item);
    });
  }

  isValidItem(item: T) {
    return this._getRowByItem(item)
      .every((value) => {
        if (typeof value === "string") {
          return !value.includes("\n") && value === value.trim() && value.length <= 400;
        }
        return true;
      });
  }

  _getRowByItem(item: T) {
    return this._json.schema.fields.map((key) => {
      switch (key.type) {
        case "number":
          return Number(item[key.name]);
        case "boolean":
          return Boolean(item[key.name]);
        case "string":
        default:
          if (item[key.name] === null || item[key.name] === undefined) {
            return null;
          }
          if (key.title.en.endsWith("[]") && Array.isArray(item[key.name])) {
            return item[key.name].join(";");
          }
          switch (typeof item[key.name]) {
            case "number":
              return String(item[key.name]);
            case "string":
              return String(item[key.name]);
            case "boolean":
              return String(item[key.name]);
            default:
              return String(item[key.name]);
          }
      }
    });
  }

  toJson() {
    return this._json;
  }
}
