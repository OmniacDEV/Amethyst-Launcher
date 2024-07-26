import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react'

import { Version, GetCachedVersions } from '../scripts/types/Version'

import { LauncherConfig, GetLauncherConfig, SetLauncherConfig } from '../scripts/Launcher'
import { GetProfiles, Profile } from '../scripts/types/Profile'

import { ipcRenderer } from 'electron'
import { GetShards, Shard } from '../scripts/types/Shard'

interface TAppStateContext {
  mods: Shard.Full[]
  SetMods: React.Dispatch<React.SetStateAction<Shard.Full[]>>

  runtimes: Shard.Full[]
  SetRuntimes: React.Dispatch<React.SetStateAction<Shard.Full[]>>

  versions: Version[]
  SetVersions: React.Dispatch<React.SetStateAction<Version[]>>

  profiles: Profile[]
  SetProfiles: React.Dispatch<React.SetStateAction<Profile[]>>

  selected_profile: number
  SetSelectedProfile: React.Dispatch<React.SetStateAction<number>>

  ui_theme: string
  SetUITheme: React.Dispatch<React.SetStateAction<string>>

  keep_launcher_open: boolean
  SetKeepLauncherOpen: React.Dispatch<React.SetStateAction<boolean>>

  developer_mode: boolean
  SetDeveloperMode: React.Dispatch<React.SetStateAction<boolean>>

  loading_percent: number
  SetLoadingPercent: React.Dispatch<React.SetStateAction<number>>

  is_loading: boolean
  SetIsLoading: React.Dispatch<React.SetStateAction<boolean>>

  status: string
  SetStatus: React.Dispatch<React.SetStateAction<string>>

  error: string
  SetError: React.Dispatch<React.SetStateAction<string>>

  // Expose functions
  saveData: () => void
}

const AppStateContext = createContext<TAppStateContext | undefined>(undefined)

export const AppStateProvider = ({ children }: { children: ReactNode }) => {
  const [mods, SetMods] = useState<Shard.Full[]>([])
  const [runtimes, SetRuntimes] = useState<Shard.Full[]>([])
  const [versions, SetVersions] = useState<Version[]>([])
  const [profiles, SetProfiles] = useState<Profile[]>([])
  const [selected_profile, SetSelectedProfile] = useState(0)
  const [ui_theme, SetUITheme] = useState('System')
  const [keep_launcher_open, SetKeepLauncherOpen] = useState(true)
  const [developer_mode, SetDeveloperMode] = useState(false)
  const [loading_percent, SetLoadingPercent] = useState(0)
  const [is_loading, SetIsLoading] = useState(false)
  const [status, SetStatus] = useState('')
  const [error, SetError] = useState('')

  // Initialize Data like all mods and existing profiles
  useEffect(() => {
    SetProfiles(GetProfiles())

    const shards = GetShards()
    SetRuntimes(shards.runtimes)
    SetMods(shards.mods)

    const readConfig = GetLauncherConfig()
    SetKeepLauncherOpen(readConfig.keep_open ?? true)
    SetDeveloperMode(readConfig.developer_mode ?? false)
    SetSelectedProfile(readConfig.selected_profile ?? 0)
    SetUITheme(readConfig.ui_theme ?? 'Light')

    SetVersions(GetCachedVersions())
  }, [])

  const [hasInitialized, setHasInitialized] = useState(false)

  const saveData = useCallback(() => {
    SetProfiles(profiles)

    const mods = GetShards().mods.filter(shard => {
      profiles[selected_profile]?.mods?.includes({ uuid: shard.meta.uuid, version: shard.meta.version })
    }).map(mod => {
      return mod.meta.name
    })

    const runtime = GetShards().runtimes.find(shard => {
      return profiles[selected_profile]?.runtime?.uuid === shard.meta.uuid
    })?.meta.name

    const launcherConfig: LauncherConfig = {
      developer_mode: developer_mode,
      keep_open: keep_launcher_open,
      mods: mods,
      runtime: runtime ?? '',
      selected_profile: selected_profile,
      ui_theme: ui_theme
    }

    SetLauncherConfig(launcherConfig)
  }, [profiles, developer_mode, keep_launcher_open, selected_profile, ui_theme])

  useEffect(() => {
    if (!hasInitialized) {
      setHasInitialized(true)
      return
    }

    saveData()
  }, [profiles, selected_profile, keep_launcher_open, developer_mode, hasInitialized, saveData])

  useEffect(() => {
    ipcRenderer.send('WINDOW_UI_THEME', ui_theme)
  }, [ui_theme])

  return (
    <AppStateContext.Provider
      value={{
        mods: mods,
        SetMods: SetMods,
        runtimes: runtimes,
        SetRuntimes: SetRuntimes,
        versions: versions,
        SetVersions: SetVersions,
        profiles: profiles,
        SetProfiles: SetProfiles,
        selected_profile: selected_profile,
        SetSelectedProfile: SetSelectedProfile,
        ui_theme: ui_theme,
        SetUITheme: SetUITheme,
        keep_launcher_open: keep_launcher_open,
        SetKeepLauncherOpen: SetKeepLauncherOpen,
        developer_mode: developer_mode,
        SetDeveloperMode: SetDeveloperMode,
        loading_percent: loading_percent,
        SetLoadingPercent: SetLoadingPercent,
        is_loading: is_loading,
        SetIsLoading: SetIsLoading,
        status,
        SetStatus: SetStatus,
        saveData,
        error: error,
        SetError: SetError
      }}
    >
      {children}
    </AppStateContext.Provider>
  )
}

export function UseAppState() {
  const context = useContext(AppStateContext)
  if (!context) throw new Error('useAppState must be used within a MyProvider')
  return context
}
