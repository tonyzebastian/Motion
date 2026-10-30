--[[
Handwriting for DaVinci Resolve (works in the free version).

Workspace → Scripts → Handwriting → Open Studio opens the Handwriting
Studio (tools/handwriting/studio) in its own window, set to the current
timeline's size and frame rate. Clips are made there (Create) and dragged
into Resolve by hand.

Installed by `npm run resolve:install`. See tools/handwriting/README.md.
--]]

local M = {}

local STUDIO = "http://127.0.0.1:4517"

-- Single-quote a string for the shell.
local function q(s)
  return "'" .. tostring(s):gsub("'", "'\\''") .. "'"
end

-- Run a shell command; returns its output and exit code.
local function sh(cmd)
  local p = io.popen(cmd .. " 2>&1; echo \"__EXIT:$?\"")
  local out = p:read("*a")
  p:close()
  local code = tonumber(out:match("__EXIT:(%d+)%s*$")) or 1
  return (out:gsub("__EXIT:%d+%s*$", "")), code
end

-- AppleScript string literal.
local function as(s)
  return '"' .. tostring(s):gsub("\\", "\\\\"):gsub('"', '\\"') .. '"'
end

local function alert(message)
  print("[Handwriting] " .. message)
  sh("/usr/bin/osascript -e " .. q("display alert " .. as("Handwriting") .. " message " .. as(message)))
end

-- The current timeline's size and frame rate, or nil if none is open.
-- Resolve may hand settings back as numbers or strings.
function M.timelineFormat(resolve)
  local ok, fmt = pcall(function()
    local project = resolve:GetProjectManager():GetCurrentProject()
    local timeline = project and project:GetCurrentTimeline()
    if not timeline then
      return nil
    end
    local rate = tonumber(tostring(timeline:GetSetting("timelineFrameRate") or ""):match("[%d%.]+"))
    return {
      width = tonumber(timeline:GetSetting("timelineResolutionWidth")),
      height = tonumber(timeline:GetSetting("timelineResolutionHeight")),
      fps = rate,
    }
  end)
  if ok and fmt and fmt.width and fmt.height and fmt.fps then
    return fmt
  end
  return nil
end

local function studioUp()
  return (sh("/usr/bin/curl -s -m 1 " .. STUDIO .. "/api/ping")):find('"ok"') ~= nil
end

-- Starts the studio (if it isn't running) and opens it in its own window.
function M.openStudio(cfg, resolve)
  local ok, err = pcall(function()
    local query = ""
    local fmt = resolve and M.timelineFormat(resolve)
    if fmt then
      query = "?w=" .. fmt.width .. "&h=" .. fmt.height .. "&fps=" .. fmt.fps
    end

    if not studioUp() then
      local log = (os.getenv("HOME") or "") .. "/Library/Logs/handwriting-studio.log"
      -- Fully detached (all output to the log, no input), so this returns
      -- straight away instead of waiting on the server.
      sh(
        "(cd "
          .. q(cfg.motionDir)
          .. " && PATH="
          .. q(cfg.nodeBin)
          .. ":\"$PATH\" exec nohup node tools/handwriting/studio/server.mjs) > "
          .. q(log)
          .. " 2>&1 < /dev/null &"
      )
      local ready = false
      for _ = 1, 30 do
        sh("sleep 0.5")
        if studioUp() then
          ready = true
          break
        end
      end
      if not ready then
        alert("The studio didn't start. Its log is at ~/Library/Logs/handwriting-studio.log.")
        return
      end
    end

    local url = STUDIO .. "/" .. query
    local _, hasChrome = sh("test -d '/Applications/Google Chrome.app'")
    if hasChrome == 0 then
      -- Its own app-style window, without browser tabs and toolbars.
      sh("/usr/bin/open -na 'Google Chrome' --args --app=" .. q(url) .. " --window-size=1440,900")
    else
      sh("/usr/bin/open " .. q(url))
    end
  end)
  if not ok then
    alert("Something went wrong:\n" .. tostring(err))
  end
end

return M
