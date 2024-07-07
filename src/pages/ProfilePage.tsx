import {useNavigate} from "react-router-dom";
import MainPanel from "../components/MainPanel";
import {Profile} from "../types/Profile";
import {useAppState} from "../contexts/AppState";
import MinecraftButton from "../components/MinecraftButton";

const ProfileButton = ({profile, index}: { profile: Profile, index: number }) => {
    const navigate = useNavigate();
    const {setSelectedProfile} = useAppState();

    const openProfile = (profile: Profile, index: number) => {
        setSelectedProfile(index);
        navigate("/profile-editor")
    }

    return (
        <div onClick={() => openProfile(profile, index)}>
            <div className="cursor-pointer border-[3px] border-[#48494A] bg-[#58585A] p-[8px]">
                <p className="minecraft-seven text-white text-[14px] px-[4px]">{profile.name}</p>
                <p className="minecraft-seven text-[#B1B2B5] text-[14px] px-[4px]">{profile.minecraft_version} ({profile.runtime})</p>
            </div>
        </div>
    )
}

export default function ProfilePage() {
    const navigate = useNavigate();
    const {allProfiles, setAllProfiles, setSelectedProfile} = useAppState();

    return (
        <MainPanel>
            <div className="flex flex-col gap-[8px] h-full p-[8px] bg-[#48494A] border-[#1E1E1F] border-[3px] overflow-hidden">
                <p className="minecraft-seven text-white text-[14px]">Profile Editor</p>
                <div className="flex flex-col gap-[3px] border-[3px] border-[#1E1E1F] h-full p-[3px] bg-[#313233] overflow-y-auto scrollbar">
                    
                    {
                        allProfiles.map((profile, index) => {
                            return <ProfileButton profile={profile} index={index} key={index}/>
                        })
                    }
                </div>

                <div className="bg-[#48494A] h-fit">
                    <MinecraftButton text="Create new profile" onClick={() => {
                        const defaultProfile: Profile = {
                            name: "New Profile",
                            minecraft_version: "1.21.0.3",
                            mods: [],
                            runtime: "Vanilla"
                        }

                        const newProfiles = [...allProfiles, defaultProfile];
                        setAllProfiles(newProfiles);

                        setSelectedProfile(newProfiles.length - 1);
                        navigate("/profile-editor");
                    }}/>
                </div>

            </div>
        </MainPanel>
    )
}