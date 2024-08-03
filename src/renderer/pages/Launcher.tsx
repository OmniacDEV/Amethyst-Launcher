import MinecraftButton from '../components/MinecraftButton'
import { UseAppState } from '../contexts/AppState'
import { IsDevModeEnabled, TryEnableDevMode } from '../scripts/functions/DeveloperMode'
import {
  CleanupInstall,
  CreateLock,
  DownloadVersion,
  ExtractVersion,
  InstallProxy,
  IsDownloaded,
  IsLocked,
  IsRegistered
} from '../scripts/functions/VersionManager'
import { RegisterVersion, UnregisterCurrent } from '../scripts/functions/AppRegistry'
import { GetLauncherConfig, SetLauncherConfig } from '../scripts/Launcher'
import child from 'child_process'
import Panel from '../components/Panel'
import { Console } from '../scripts/types/Console'
import React from 'react'

export default function Launcher() {
  const {
    profiles,
    selected_profile,
    SetSelectedProfile,
    loading_percent,
    status,
    SetStatus,
    is_loading,
    SetIsLoading,
    error,
    SetError,
    SetLoadingPercent
  } = UseAppState()

  const LaunchGame = async () => {
    if (is_loading) return

    if (profiles.length === 0) {
      throw new Error('Cannot launch without a profile')
    }

    const profile = profiles[selected_profile]
    const version = profile.version

    if (version === undefined) {
      throw new Error(`Version ${profile.version.sem_version} not found`)
    }

    SetError('')
    SetIsLoading(true)

    // Check that the user has developer mode enabled on windows for the game to be installed through loose files.
    if (!IsDevModeEnabled()) {
      const enabled_dev = await TryEnableDevMode()
      if (!enabled_dev) {
        throw new Error("Failed to enable Windows 'Developer Mode', please enable manually")
      }
    }

    // We create a lock file when starting the download
    // if we are doing a launch, and we detect it for the version we are targeting
    // there is a good chance the previous install/download failed and therefore remove it.
    const didPreviousDownloadFail = IsLocked(version)

    if (didPreviousDownloadFail) {
      CleanupInstall(version, false)
    }

    // Check for the folder for the version we are targeting, if not present we need to fetch.
    if (!IsDownloaded(version)) {
      CreateLock(version)
      Console.StartGroup(Console.ActionStr('Download Version'))
      {
        await DownloadVersion(version, SetStatus, SetLoadingPercent)
      }
      Console.EndGroup()
      Console.StartGroup(Console.ActionStr('Extract Version'))
      {
        await ExtractVersion(version, SetStatus, SetLoadingPercent)
      }
      Console.EndGroup()
      CleanupInstall(version, true)

      InstallProxy(version)
    }

    // Only register the game if needed
    if (!IsRegistered(version)) {
      SetStatus('Unregistering Version')
      SetLoadingPercent(0)
      await UnregisterCurrent()
      SetStatus('Registering Version')
      SetLoadingPercent(0.5)
      await RegisterVersion(version)
      SetLoadingPercent(1)

      SetLauncherConfig(GetLauncherConfig())
    }

    SetIsLoading(false)
    SetStatus('')

    child.spawn(`start minecraft:`, { shell: true })
  }

  const launchGame = async () => {
    Console.StartGroup(Console.ActionStr('Launch Game'))
    {
      try {
        await LaunchGame()
        Console.Result('Successful')
      } catch (e) {
        Console.Group(Console.ResultStr('Failed', true), () => {
          Console.Error((e as Error).message)
          SetError((e as Error).message)
          SetStatus('')
          SetIsLoading(false)
        })
      }
    }
    Console.EndGroup()
  }

  const profile_names = profiles?.map(profile => profile.name)

  return (
    <Panel>
      <div className="flex flex-col justify-between h-full w-full">
        {error !== '' && (
          <div className="flex flex-row gap-[8px] bg-[#CA3636] w-full border-[#CF4A4A] border-[3px] justify-between items-center">
            <div className="flex flex-row min-w-0 p-[8px] gap-[8px]">
              <img src="images/icons/warning-icon.png" className="w-[24px] h-[24px] pixelated" alt="" />
              <p className="minecraft-seven text-[#FFFFFF] text-[16px] overflow-ellipsis overflow-hidden whitespace-nowrap">
                {error}
              </p>
            </div>
            <div className="shrink-0 flex flex-row p-[8px] gap-[8px] justify-right items-top">
              <div className="cursor-pointer p-[4px]" onClick={() => SetError('')}>
                <svg width="18" height="18" viewBox="0 0 12 12">
                  <polygon
                    className="fill-[#FFFFFF]"
                    fillRule="evenodd"
                    points="11 1.576 6.583 6 11 10.424 10.424 11 6 6.583 1.576 11 1 10.424 5.417 6 1 1.576 1.576 1 6 5.417 10.424 1"
                  />
                </svg>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col justify-end grow w-full">
          {/* Not affiliated disclaimer */}
          <div className="bg-[#0c0c0cc5] w-fit ml-auto rounded-t-[3px] p-[4px]">
            <p className="minecraft-seven text-white text-[13px]">
              Not approved by or associated with Mojang or Microsoft
            </p>
          </div>

          {/* Loading bar */}
          <div
            className={`flex items-center bg-[#313233] ${status || is_loading ? 'h-[25px]' : 'h-0'} transition-all duration-300 ease-in-out`}
          >
            <div
              className={`bg-[#3C8527] absolute ${is_loading ? 'min-h-[25px]' : 'min-h-0'} transition-all duration-300 ease-in-out`}
              style={{ width: `${loading_percent * 100}%` }}
            ></div>
            <p className="minecraft-seven absolute z-30 text-white overflow-hidden text-ellipsis whitespace-nowrap max-w-full px-2">
              {status}
            </p>
          </div>

          {/* Profile Selector & Play Button */}
          <div className="flex flex-row gap-[8px] border-[#1E1E1F] border-[3px] p-[8px] bg-[#48494A]">
            <div className="w-[30%] mt-auto">
              <div className="flex flex-col gap-[4px]">
                <label htmlFor={"profile-select"} className="minecraft-seven text-white text-[14px]">
                  {"Profile"}
                </label>
                {profile_names.length > 0 ? (
                  <select
                    name={"profile-select"}
                    id={"profile-select"}
                    onChange={event => {
                      SetSelectedProfile(event.target.selectedIndex)
                    }}
                    value={profile_names[profile_names.indexOf(profiles[selected_profile]?.name)]}
                    className="border-[3px] border-[#1E1E1F] bg-[#313233] w-full h-[25px] text-white minecraft-seven text-[12px]"
                  >
                    {profile_names.map((option, index) => (
                      <option value={option} key={index} className="text-white font-sans">
                        {option}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="border-[3px] border-[#1E1E1F] bg-[#313233] w-full h-[25px]" />
                )}
              </div>
            </div>

            <div className="w-[70%]">
              <MinecraftButton text="Launch Game" onClick={launchGame} />
            </div>
          </div>
        </div>
      </div>
    </Panel>
  )
}
