--[[
此文件包含了Wiki模块中使用的类型定义。

类型注释文档：https://luals.github.io/wiki/annotations/
]]

--- @meta

--- @alias Role "tank" | "damage" | "support"

--- @class AbilityData 技能信息
---   @field key string
---   @field name string
---   @field hero string?
---   @field role Role
---   @field category string
---   @field button string
---   @field description string
---   @field basicStats AbilityDataBasicStats
---   @field keywords { name: string, value: string }[]
---   @field detailStats { name: string, value: string }[]

--- @class AbilityDataBasicStats
---   @field ammo number?
---   @field reloadTime number?
---   @field isSecondWeapon boolean?
---   @field cooldown number?
---   @field charges number?
---   @field ultimateCharge number?
---   @field perkIndex string?

-------------------------------------------------------------------------------
-- MARK: Scribunto基础

--- @class MW
--- https://www.mediawiki.org/wiki/Extension:Scribunto/Lua_reference_manual#Scribunto_libraries
mw = {}

--- Adds a warning which is displayed above the preview when previewing an edit. `text` is parsed as wikitext.
--- @param text string
function mw.addWarning(text) end

--- Calls tostring() on all arguments, then concatenates them with tabs as separators.
--- @param ... any
--- @return string
function mw.allToString(...) end

--- Creates a deep copy of a value. All tables (and their metatables) are reconstructed from scratch. Functions are still shared, however.
function mw.clone(value) end

--- Returns the current frame object, typically the frame object from the most recent `#invoke`.
--- @return ScribuntoFrame
function mw.getCurrentFrame() end

--- Adds one to the "expensive parser function" count, and throws an exception if it exceeds the limit.
function mw.incrementExpensiveFunctionCount() end

--- Returns true if the current `#invoke` is being substed, false otherwise.
function mw.isSubsting() end

--- 加载模块
--- @param module string 模块页面标题，如 `Module:Convert/data`
--- @return table
function mw.loadData(module) end

--- 加载JSON数据
--- @param page string 页面标题
--- @return table
function mw.loadJsonData(page) end

--- 循环出对象的所有属性和值
--- @param object any
--- @return string
function mw.dumpObject(object) end

--- Passes the arguments to mw.allToString(), then appends the resulting string to the log buffer.
--- @param ... any
function mw.log(...) end

--- Calls mw.dumpObject() and appends the resulting string to the log buffer. If prefix is given, it will be added to the log buffer followed by an equals sign before the serialized string is appended (i.e. the logged text will be "prefix = object-string").
---@param object any
---@param prefix string?
function mw.logObject(object, prefix) end

-------------------------------------------------------------------------------
-- MARK: Frame

--- @class ScribuntoFrame
local frame = {}

--- @type table<number | string, string>
frame.args = {}

--- @param name string
--- @param args table
--- @return string
function frame:callParserFunction(name, args) end

--- @param name string
--- @param ... string
--- @return string
function frame:callParserFunction(name, ...) end

--- @param options { name: string, args: table }
function frame:callParserFunction(options) end

--- @param options { name: string, args: table }
function frame:expandTemplate(options) end

--- @param name string
--- @param content string
--- @param args table | string
function frame:extensionTag(name, content, args) end

--- @param options { name: string, content: string, args: table | string }
function frame:extensionTag(options) end

--- @return ScribuntoFrame?
function frame:getParent() end

--- @return string
function frame:getTitle() end

--- @return ScribuntoFrame
function frame:newChild(options) end

--- @param text string
--- @return string
function frame:preprocess(text) end

--- @param options { text: string }
--- @return string
function frame:preprocess(options) end

--- @param arg number | string
--- @return { expand: fun(self): string }?
function frame:getArgument(arg) end

--- @param options { name: number | string }
--- @return { expand: fun(self): string }?
function frame:getArgument(options) end

--- @param text string
--- @return { expand: fun(self): string }?
function frame:newParserValue(text) end

--- @param options { text: number | string }
--- @return { expand: fun(self): string }?
function frame:newParserValue(options) end

--- @param options { title: string, args: table }
--- @return { expand: fun(self): string }?
function frame:newTemplateParserValue(options) end

function frame:argumentPairs() end

-------------------------------------------------------------------------------
-- MARK: 内置库

--- @class ScribuntoUstring : stringlib
mw.ustring = {}

--- @class ScribuntoText
mw.text = {}

---@param string string
---@param flags number? 0 或 `mw.text.JSON_PRESERVE_KEYS`、`mw.text.JSON_TRY_FIXING` 或相加
function mw.text.jsonDecode(string, flags) end

-------------------------------------------------------------------------------
-- MARK: 扩展库

--- @class ScribuntoExt
mw.ext = {}

--- @class ScribuntoExtMustache
mw.ext.mustache = {}

--- @param templateName string
--- @param args table
--- @param flags number? `mw.ext.mustache.PERSERVE_KEY` `mw.ext.mustache.PARSE_ARGS`
function mw.ext.mustache.render(templateName, args, flags) end

-------------------------------------------------------------------------------
-- MARK: 灰机特有

--- @class Huiji
mw.huiji = {}

--- @class HuijiDb
mw.huiji.db = {}

--- 查询文档，默认返回所有符合条件的数据
--- @param filter table
--- @param options table?
--- @return table[]
function mw.huiji.db.find(filter, options) end

--- 查询文档，返回第一个符合条件的数据
--- @param filter table
--- @param options table?
--- @return table?
function mw.huiji.db.findOne(filter, options) end

--- 查询文档，返回符合条件的数据数量
--- @param filter table
--- @param options table?
--- @return number
function mw.huiji.db.count(filter, options) end

--- 聚合查询文档
--- @param filter table[]
--- @param options table?
--- @return table[]
function mw.huiji.db.aggregate(filter, options) end
