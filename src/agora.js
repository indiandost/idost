import AgoraRTC from "agora-rtc-sdk-ng";

const APP_ID = import.meta.env.VITE_AGORA_APP_ID;

export const startAgoraCall = async (channelName, type) => {

  const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

  await client.join(APP_ID, channelName, null, null);

  if (type === "audio") {
    const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
    await client.publish([audioTrack]);
  } else {
    const [mic, cam] = await AgoraRTC.createMicrophoneAndCameraTracks();
    await client.publish([mic, cam]);
  }

  return client;
};