local p = {}
--- @type fun(frame: ScribuntoFrame): table<number | string, string>
local getArgs = require("Module:Arguments").getArgs
--- @type fun(filename: string): string
local getImageUrl = require("Module:Utils").getImageUrl

local keywordDescriptions = mw.huiji.loadJson("Data:Stub/AbilityKeywords.json")

--- @param ability AbilityData
--- @return string?
local function getAbilityIconUrl(ability)
	-- 临时无图
	if ability.hero == "金驭" then return nil end
	if ability.hero == "埃姆雷" then return nil end
	if ability.hero == "安燃" then return nil end
	if ability.hero == "瑞稀" then return nil end
	if ability.hero == "飞天猫" then return nil end
	if mw.ustring.sub(ability.name, 0, 3) == "副职责" then return nil end

	local filename = ability.hero and (ability.hero .. "_" .. ability.name .. "_图标.png") or (ability.name .. "_图标.png")
	return getImageUrl(filename)
end

--- 获取技能某个详细数据的值
--- @param abilityData AbilityData
--- @param statName string
--- @param subStatName string?
--- @return string?
local function getAbilityDetailStat(abilityData, statName, subStatName)
	--- @type string?
	local statValue
	for _, detailStat in ipairs(abilityData.detailStats) do
		if detailStat.name == statName then
			statValue = detailStat.value
			break
		end
	end
	if not statValue then return nil end
	if not subStatName then return statValue end
	return string.match(statValue, "([^>]-)（" .. subStatName .. "）")
end

--- @param frame string | ScribuntoFrame
function p.getKeywordDescription(frame)
	if type(frame) == "string" then
		return keywordDescriptions[frame]
	else
		local keyword = getArgs(frame)[1]
		return keywordDescriptions[keyword]
	end
end

function p.renderInfo(frame)
	local args = getArgs(frame)
	local ability
	if args[1] then
		ability = mw.huiji.db.findOne({ _dataType = "ability", key = args[1] })
	elseif args.data then
		ability = mw.text.jsonDecode(args.data)
	end
	if not ability or not ability.name then return "[[模块:Ability]]错误：技能无效" end

	ability.keywords = ability.keywords or {}
	if #ability.keywords > 0 then
		ability.hasKeywords = true
		for _, keyword in ipairs(ability.keywords) do
			if not keyword.value or keyword.value == "" then
				keyword.value = keywordDescriptions[keyword.name]
			end
			if keyword.value and string.find(keyword.value, "<mark>") then
				keyword.hasMark = true
			end
		end
	end
	ability.icon = getAbilityIconUrl(ability)
	ability.description = mw.ustring.gsub(ability.description or "", "<kbd>([^<]+)</kbd>", function(s)
		if mw.ustring.find(s, "鼠标") then
			return string.format('<div class="hai-kbd" data-kbd="%s" title="%s"></div>', s, s)
		end
		return string.format('<kbd class="ow-kbd">%s</kbd>', s)
	end)

	ability.basicStats = ability.basicStats or {}
	if ability.basicStats.ammo == -1 then
		ability.basicStats.ammo = "∞"
	end

	ability.detailStats = ability.detailStats or {}
	ability.hasDetailStats = #ability.detailStats > 0

	local extraStats = args["extraStats"]
	if extraStats and extraStats ~= "" then
		ability.extraStats = extraStats
	end

	local output = mw.ext.mustache.render("AbilityInfo", ability)

	if args.details then
		local details = args.details
		details = mw.ustring.gsub(details, "%$ds:([^$]-)%$", function(ds)
			local statName, statSubName = ds, nil
			if mw.ustring.find(statName, "/") then
				statSubName = mw.ustring.match(statName, "/([^/]+)$")
				statName = mw.ustring.match(statName, "^[^/]+")
			end
			return getAbilityDetailStat(ability, statName, statSubName) or nil
		end)
		output = output .. '\n\n<span class="font-bold">细节</span>\n' .. details
	end

	return output
end

function p.renderLink(frame)
	local args = getArgs(frame)
	local key = args[1]
	return p._renderLink(key, args)
end

local abilityNameAlias = {
	["破坏球/感应地雷"] = "破坏球/地雷禁区",
	["托比昂/炮台"] = "托比昂/部署炮台",
	["艾什/鲍勃"] = "艾什/召唤鲍勃",
	["拉玛刹/猛拳"] = "拉玛刹/猛拳（天罚形态）",
}
function p._renderLink(key, options)
	options = options or {}
	if abilityNameAlias[key] then
		options.text = options.text or mw.ustring.match(key, "[^/]+$")
		return p._renderLink(abilityNameAlias[key], options)
	end
	local file = mw.ustring.gsub(key, "/", "_") .. "_图标.png"
	local link = options.link or mw.ustring.gsub(key, "/", "#")
	local text = options.text or mw.ustring.match(key, "[^/]+$")
	local className = options.first and "inline-icon-first" or "inline-icon"
	return string.format("[[文件:%s|40px|class=%s|link=%s]][[%s|%s]]", file, className, link, link, text)
end

function p.renderLinkList(frame)
	return p._renderLinkList(getArgs(frame))
end

function p._renderLinkList(args)
	local templateArgs = {
		class = "ability-link-list",
	}
	for i, arg in ipairs(args) do
		local key = mw.ustring.match(arg, "[^|]+")
		local options = {}
		options.text = mw.ustring.match(arg, "|text=([^|]+)")
		options.link = mw.ustring.match(arg, "|link=([^|]+)")
		table.insert(templateArgs, p._renderLink(key, options))
	end
	return mw.getCurrentFrame():expandTemplate { title = "ColumnList", args = templateArgs }
end

function p.renderLinkListByKeyword(frame)
	local args = getArgs(frame)
	local keyword = args[1]
	local description = args[2]
	return p._renderLinkListByKeyword(keyword, description)
end

function p._renderLinkListByKeyword(keyword, description)
	local query = {
		_dataType = "ability",
		keywords = {
			["$elemMatch"] = {
				name = keyword,
			},
		},
	}
	if description then
		query.keywords["$elemMatch"].value = { ["$regex"] = description }
	end

	local abilities = mw.huiji.db.find(query)
	local keys = {}
	for _, ability in ipairs(abilities) do
		table.insert(keys, ability.key)
	end
	return p._renderLinkList(keys)
end

return p