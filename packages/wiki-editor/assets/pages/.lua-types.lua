--[[
此文件包含了Wiki模块中使用的类型定义。

类型注释文档：https://luals.github.io/wiki/annotations/
]]

--- @meta

--- @alias Role "tank" | "damage" | "support"

--- @class HeroData
---   @field key string
---   @field name string
---   @field nameEn string
---   @field role Role
---   @field subRole string?
---   @field revealDate string?
---   @field releaseDate string?
---   @field releaseDateDescription string?
---   @field color string?
---   @field nationality string?
---   @field birthday string?
---   @field age string?
---   @field hitPoints { health: number, armor: number, shields: number }
---   @field movementSpeed number
---   @field meleeDamage number
---   @field perkXp { minor: number, major: number }---
---   @field description string
---   @field story { intro: string, chapters: { title: string, content: string }[], accessDate?: string }

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

--- @class HeroQuoteData
---   @field fileId string
---   @field fileId_n string
---   @field hero string
---   @field heroName string
---   @field subtitle string
---   @field subtitle_en string
---   @field category string
---   @field skin string?
---   @field criteria string?
---   @field weight number?
---   @field conversations string[]?
---   @field added string?
---   @field removed string?
---   @field criteriaObject HeroQuoteCriteria?
---   @field conversationId string?
---   @field position number?
---
--- @class HeroQuoteCriteria
--- @field type string
--- @field negative boolean?

--- @class HeroQuoteCriteriaNested : HeroQuoteCriteria
--- @field type '"nested"'
--- @field total number
--- @field needed number
--- @field conditions HeroQuoteCriteria[]

--- @class HeroQuoteCriteriaToHero : HeroQuoteCriteria
--- @field type '"toHero"'
--- @field hero string|nil
--- @field heroTag string|nil
--- @field negative boolean|nil

--- @class HeroQuoteCriteriaWithHero : HeroQuoteCriteria
--- @field type '"withHero"'
--- @field hero string|nil
--- @field heroTag string|nil
--- @field negative boolean|nil

--- @class HeroQuoteCriteriaMap : HeroQuoteCriteria
--- @field type '"map"'
--- @field map string
--- @field notEventVariants boolean|nil
--- @field negative boolean|nil

--- @class HeroQuoteCriteriaTeam : HeroQuoteCriteria
--- @field type '"team"'
--- @field team '"attack"'|'"defense"'
--- @field unknownBool boolean|nil
--- @field negative boolean|nil

--- @class HeroQuoteCriteriaToGender : HeroQuoteCriteria
--- @field type '"toGender"'
--- @field gender '"male"'|'"female"'|'"neutral"'
--- @field negative boolean|nil

--- @class HeroQuoteCriteriaScripted : HeroQuoteCriteria
--- @field type '"scripted"'
--- @field script string
--- @field scriptDesc string
--- @field negative boolean|nil

--- @class HeroQuoteCriteriaCelebration : HeroQuoteCriteria
--- @field type '"celebration"'
--- @field celebration string
--- @field negative boolean|nil

--- @class HeroQuoteCriteriaGameMode : HeroQuoteCriteria
--- @field type '"gameMode"'
--- @field gameMode string
--- @field negative boolean|nil

--- @class HeroQuoteCriteriaMission : HeroQuoteCriteria
--- @field type '"mission"'
--- @field mission string|nil
--- @field objective string|nil
--- @field negative boolean|nil

--- @class HeroQuoteCriteriaTalent : HeroQuoteCriteria
--- @field type '"talent"'
--- @field talent string
--- @field negative boolean|nil

--- @class HeroQuoteCriteriaUnknown : HeroQuoteCriteria
--- @field type '"unknown"'
--- @field raw string
--- @field negative boolean|nil


-------------------------------------------------------------------------------
-- MARK: Scribunto基础

--- @class MW
--- https://www.mediawiki.org/wiki/Extension:Scribunto/Lua_reference_manual#Scribunto_libraries
mw = {}

--- @param text string
function mw.addWarning(text) end

--- @param ... any
--- @return string
function mw.allToString(...) end

function mw.clone(value) end

--- @return ScribuntoFrame
function mw.getCurrentFrame() end

function mw.incrementExpensiveFunctionCount() end

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

--- @param ... any
function mw.log(...) end

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

mw.text = {}

---@param string string
---@param flags number? 0 或 `mw.text.JSON_PRESERVE_KEYS`、`mw.text.JSON_TRY_FIXING` 或相加
---@return any
function mw.text.jsonDecode(string, flags) end

--- 分隔字符串
--- @param string string
--- @param pattern string
--- @param plain boolean? 如果为 `true`，`pattern` 会被视作普通字符串，而不是 Lua 模式。
--- @return string[]
function mw.text.split(string, pattern, plain) end

--- 分隔字符串迭代器
--- @param string string
--- @param pattern string
--- @param plain boolean? 如果为 `true`，`pattern` 会被视作普通字符串，而不是 Lua 模式。
--- @return fun(): string?
function mw.text.gsplit(string, pattern, plain) end

--- 移除字符串首尾空格
--- @param string string
--- @return string
function mw.text.trim(string) end

mw.title = {}

--- @return ScribuntoTitleObject?
function mw.title.getCurrentTitle() end

--- @param ID number
--- @return ScribuntoTitleObject?
function mw.title.new(ID) end

--- @param text string
--- @param namespace number | string?
--- @return ScribuntoTitleObject?
function mw.title.new(text, namespace) end

--- @class ScribuntoTitleObject
--- @field exists boolean 是否存在
--- @field namespace number 命名空间ID
local title = {}

mw.html = {}


--- @param tagName string?
--- @param args ScribuntoHtmlCreateArgs?
--- @return ScribuntoHtmlObject
function mw.html.create(tagName, args) end

--- @class ScribuntoHtmlCreateArgs
--- @field selfClosing boolean?
--- @field parent ScribuntoHtmlObject?
local htmlCreateArgs = {}

--- @class ScribuntoHtmlObject
local html = {}

--- @param ... string
--- @return ScribuntoHtmlObject
function html:wikitext(...) end

--- @param tagName string
--- @param args ScribuntoHtmlCreateArgs?
--- @return ScribuntoHtmlObject
function html:tag(tagName, args) end

--- @param className string
--- @return ScribuntoHtmlObject
function html:addClass(className) end

--- @return ScribuntoHtmlObject
function html:done() end

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
--- @return any?
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

-------------------------------------------------------------------------------
-- MARK: 站内

--- @class SiteStringUtils
local StringUtils = {}

--- @param str string
--- @param prefix string
--- @return boolean
function StringUtils.startWith(str, prefix) end

--- @param str string
--- @param delimiter string
--- @return string[]
function StringUtils.split(str, delimiter) end

--- @class SiteArrayUtils
local ArrayUtils = {}

--- @generic T
--- @param array T[]
--- @param callback fun(value: T, index: number)
function ArrayUtils.forEach(array, callback) end

--- @generic T, U
--- @param array T[]
--- @param callback fun(value: T, index: number): U
--- @return U[]
function ArrayUtils.map(array, callback) end

--- @generic T
--- @param array T[]
--- @param callback fun(value: T, index: number): boolean?
--- @return T[]
function ArrayUtils.filter(array, callback) end

--- @generic T
--- @param array T[]
--- @param callback fun(value: T, index: number): boolean?
--- @return boolean
function ArrayUtils.some(array, callback) end

--- @generic T
--- @param array T[]
--- @param callback fun(value: T, index: number): boolean?
--- @return boolean
function ArrayUtils.every(array, callback) end
