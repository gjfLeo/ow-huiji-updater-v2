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
  // isArray
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
              en: header.key,
            },
          };
        }),
      },
      data: [],
    });
  }

  addItem(item: T) {
    this._json.data.push(this._json.schema.fields.map((key) => {
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
    }));
  }

  addItems(items: T[]) {
    items.forEach((item) => {
      this.addItem(item);
    });
  }

  get json() {
    return this._json;
  }
}
