<template>
  <div style="display: grid; margin: auto; grid-template-rows: auto 1fr; align-items: center; width: max-content">
    <div style="grid-row: 1; display: flex; justify-content: space-between; width: 1120px; margin: auto">
      <span class="logo">youtogether</span>
      <div style="display: flex; align-items: center">
        <img style="width: 10px; padding: 10px" v-if="hasPassword" :src="require('../assets/lock.svg')" alt="locked"/>
        <img style="width: 13px; padding: 10px" v-else :src="require('../assets/unlock.svg')" alt="unlocked"/>
        <span style="display: flex; align-items: center; font-size: 12px"
        ><img style="width: 13px; padding: 6px" :src="require('../assets/users.svg')" alt="users"/>{{
            participants.length
          }}</span
        >
      </div>
    </div>
    <div style="display: flex; flex-direction: row; justify-content: center; margin: auto">
      <div class="frame">
        <div>
          <!-- iframe start -->
          <YouTube
              v-show="this.currentVideoId != null"
              :src="this.currentVideoId"
              :width="800"
              :height="450"
              :player-vars="YT_PLAYER_PARAMS"
              @ready="onReady"
              @state-change="onPlayerStateChange"
              @playback-rate-change="onPlayerRateChange"
              ref="youtube"/>
          <img
              v-if="this.currentVideoId == null"
              width="800"
              :src="require('../assets/empty-playlist.png')"
              alt="playlist is empty"/>
          <!-- iframe end -->

          <!-- information start -->
          <div class="information">
            <div class="innerContainer">
              <div class="informationTitle">
                <span @click="titleModalState = true" class="roomTitle">{{ title }}</span>
                <TitleModal
                    class="titleModal"
                    v-if="titleModalState && this.userRole == 'HOST'"
                    @success="changeTitle"></TitleModal>
              </div>
              <div class="informationVideo">
                <span style="color: #49dcb1; font-size: 13px; font-weight: 600">현재 재생 중인 유튜브 영상</span>
                <span style="font-size: 13px">{{ currentVideoTitle || "지금은 쉬고 있어요" }}</span>
                <span v-if="this.currentChannelTitle != null" style="font-size: 12px; padding-top: 5px"
                >채널 {{ currentChannelTitle }}</span
                >
              </div>
            </div>
            <div v-if="titleModalState == true" class="modalBackground" @click.self="closeModal"></div>
            <div class="youtubeLink">
              <span v-if="this.nextVideoErrorMessage != null" class="nextVideoError">{{ nextVideoErrorMessage }}</span>
              <button v-if="this.isEditableRole" style="font-size: 11px" @click="playNextVideo" title="next video">
                >>
              </button>
            </div>
          </div>
          <!-- information end -->
        </div>

        <!-- side group -->
        <div class="sideGroup">
          <!-- playlist start -->
          <div class="playlist">
            <div class="youtubeLink">
              <input type="text" placeholder="YouTube 영상 링크를 넣어주세요" v-model="videoUrlInput"/>
              <button @click="addVideo" title="add new video">+</button>
            </div>
            <ul>
              <li class="video" v-for="item in playlist" :key="item.index">
                <img style="width: 100px; height: 70px" :src="item.thumbnail"/>
                <div
                    style="
                    display: flex;
                    flex-direction: column;
                    justify-content: space-evenly;
                    width: 140px;
                    height: 70px;
                    padding-left: 5px;
                  ">
                  <span id="playlistVideoTitle">
                    {{ item.videoTitle }}
                  </span>
                  <span style="font-size: 11px; font-weight: 400">{{ item.channelTitle }}</span>
                </div>
                <button v-show="isEditable" class="trash" @click="deleteVideo(item.videoNumber)">
                  <img style="width: 7px" :src="require('../assets/trash.svg')" alt="delete"/>
                </button>
              </li>
            </ul>
          </div>
          <!-- playlist end -->

          <!-- chat start -->
          <div class="chat">
            <ul class="messages">
              <li v-for="(item, idx) in messages" :key="idx">
                <span class="alarmIcon" v-if="item.messageType == 'ALARM'">!</span>
                <span class="chatNickname" v-if="item.messageType == 'CHAT'">{{ this.getNickname(item.userId) }}</span
                ><span>{{ item.content }}</span>
              </li>
            </ul>
            <input type="text" v-model="message" @keypress.enter="sendMessage" placeholder="채팅을 입력해주세요"/>
          </div>
          <!-- chat end -->

          <!-- participants list start -->
          <div style="position: relative">
            <div class="participantsList">
              <table class="participants">
                <tr v-for="(item, idx) in participants" :key="idx">
                  <td style="text-align: start">
                    {{
                      item.nickname
                    }}<span class="me" @click="nicknameModalState = true" v-if="item.userId == this.userId">me</span>
                  </td>
                  <td @click="popUpRoleModal(item.role, item.userId)" style="width: 30%">{{ item.role }}</td>
                </tr>
              </table>
            </div>
            <NicknameModal
                class="nicknameModal"
                v-if="nicknameModalState"
                @success="nicknameModalState = false"></NicknameModal>
            <RoleModal
                :userRole="this.userRole"
                :originTargetUserRole="this.originTargetUserRole"
                :targetUserId="this.targetUserId"
                class="roleModal"
                v-if="roleModalState"
                @success="roleModalState = false"></RoleModal>
          </div>
          <div v-if="nicknameModalState || roleModalState" class="modalBackground" @click.self="closeModal"></div>
          <!-- participants list end -->
        </div>
        <!-- side group -->
      </div>
    </div>
  </div>
</template>

<script>
import SockJS from "sockjs-client";
import Stomp from "webstomp-client";
import axios from "axios";
import NicknameModal from "@/components/NicknameModal.vue";
import TitleModal from "@/components/TitleModal.vue";
import RoleModal from "@/components/RoleModal.vue";
import YouTube from "vue3-youtube";

axios.defaults.withCredentials = true;

export default {
  components: {NicknameModal, TitleModal, RoleModal, YouTube},
  // disconnect websocket before leave
  beforeRouteLeave(to, from, next) {
    if (this.ws != null) {
      this.ws.disconnect();
    }

    next();
  },
  data() {
    return {
      serverBaseUrl: process.env.VUE_APP_SERVER_URL,
      ws: null,
      player: null,
      YT_PLAYER_PARAMS: {autoplay: 1},

      roomCode: this.$route.params.roomCode,
      title: "",
      hasPassword: false,

      message: "",
      messages: [],

      currentVideoId: null,
      currentVideoTitle: null,
      currentChannelTitle: null,
      currentTime: 0,
      currentRate: 1.0,
      nextVideoErrorMessage: null,

      playerVars: null,
      playlist: [],
      videoUrlInput: "",

      userId: null,
      userRole: null,
      targetUserId: null,
      originTargetUserRole: null,
      newUserRole: null,
      priorityMap: new Map(),
      isEditableRole: false,

      participants: [],
      nicknameMapper: new Map(),

      nicknameModalState: false,
      titleModalState: false,
      roleModalState: false,

      playerState: null,
      changeTime: 0,
      focusFlag: false,
      iframeLock: false,
      statusLock: false,

      interval:null
    };
  },
  created() {
    const priorities = {
      HOST: 5,
      MANAGER: 4,
      EDITOR: 3,
      GUEST: 2,
      VIEWER: 1,
    };

    for (const key in priorities) {
      this.priorityMap.set(key, priorities[key]);
    }
  },
  beforeUnmount() {
    clearInterval(this.interval);
  },
  methods: {
    async enterRoom() {
      await axios
          .post(this.serverBaseUrl + "/rooms/" + this.roomCode, {
            passwordInput: localStorage.getItem("roomPassword_" + this.roomCode) || null,
          })
          .then((res) => {
            this.title = res.data.data.roomTitle;
            this.userId = res.data.data.user.userId;
            this.userRole = res.data.data.user.role;
            this.hasPassword = res.data.data.passwordExist;
            this.currentVideoTitle = res.data.data.currentVideoTitle;
            this.currentChannelTitle = res.data.data.currentChannelTitle;
            this.isEditableRole = this.isEditable();
            this.currentVideoId = res.data.data.currentVideoId;

            this.connect();
          })
          .catch((error) => {
            if (error.response.data.code == 403) {
              alert("비밀번호가 일치하지 않아서 입장할 수 없어요");
            }
            this.$router.push("/rooms");
          });
    },

    connect() {
      const sock = new SockJS(this.serverBaseUrl + "/stomp");

      this.ws = Stomp.over(sock);
      this.ws.reconnect_delay = 5000;

      // 4. subscribe with room code
      this.ws.connect({}, () => {
        this.ws.subscribe("/sub/messages/rooms/" + this.roomCode, (message) => {
          this.handleMessage(JSON.parse(message.body));
        });
      });
    },

    // received message handling method
    handleMessage(message) {
      switch (message.messageType) {
        case "CHAT":
          this.messages.push({
            messageType: message.messageType,
            userId: message.userId,
            content: message.content,
          });
          this.scrollToBottom(".chat > ul");
          break;
        case "PARTICIPANTS":
          this.participants = message.participants;
          this.participants.forEach((participant) => {
            this.nicknameMapper.set(participant.userId, participant.nickname);
            if (participant.userId == this.userId) {
              this.userRole = participant.role;
              this.isEditableRole = this.isEditable();
            }
          });
          this.scrollToBottom(".chat > ul");
          break;
        case "ROOM_TITLE":
          this.title = message.changedTitle;
          break;
        case "PLAYLIST":
          this.playlist = message.playlist;
          break;
        case "VIDEO_SYNC_INFO":
          if (this.iframeLock) {
            break;
          }
          if (message.playerState === "END") {
            this.currentVideoId = null;
            this.currentVideoTitle = null;
            this.currentChannelTitle = null;
          }
          if (message.playerState === "PLAY") {   // 재생 중
            if (this.currentVideoId !== message.videoId) {    // 다른 영상일 때
              this.currentVideoId = message.videoId;
              this.player.loadVideoById(this.currentVideoId, message.playerCurrentTime);
            }
            if (Math.abs(this.player.getCurrentTime() - message.playerCurrentTime) >= 0.6) {  // 시간이 안맞을 때
              this.statusLock = true;
              setTimeout(() => this.statusLock = false, 500);
              this.player.seekTo(message.playerCurrentTime);
            }
            if (this.currentRate !== message.playerRate) { // 재생 속도가 변경되었을 때
              this.statusLock = true;
              setTimeout(() => this.statusLock = false, 500);
              this.currentRate = message.playerRate;
              this.player.setPlaybackRate(this.currentRate);
            }
            if (this.player.getPlayerState() !== 1) {   // 클라이언트가 재생중이 아니라면
              this.statusLock = true;
              setTimeout(() => this.statusLock = false, 500);
              this.player.playVideo();
            }
          } else {                                // 일시 정지 중
            if (this.player.getPlayerState() !== 2) {   // 클라이언트가 일시정지 중이 아니라면
              this.statusLock = true;
              setTimeout(() => this.statusLock = false, 500);
              this.player.pauseVideo();
            }
          }
          break;
        case "ALARM":
          this.messages.push({
            messageType: message.messageType,
            content: message.content,
          });
          this.scrollToBottom(".chat > ul");
          break;
        case "CHAT_HISTORIES":
          this.messages = message.chatHistories;
          break;
        case "START_VIDEO_INFO":
          this.currentVideoTitle = message.videoTitle;
          this.currentChannelTitle = message.channelTitle;
          break;
        default:
          console.warn(`Unknown message type: ${message.messageType}`);
      }
    },

    // scroll to new message
    scrollToBottom(selector) {
      const chattings = document.querySelector(selector);
      setTimeout(() => {
        if (chattings) {
          chattings.scrollTop = chattings.scrollHeight;
        }
      }, 20);
    },

    // send message to server
    sendMessage() {
      if (this.message === "") {
        return;
      }

      this.ws.send(
          "/pub/messages/chat",
          JSON.stringify({
            roomCode: this.roomCode,
            content: this.message,
          })
      );

      this.message = "";
    },

    // get user nickname by nicknameMapper
    getNickname(userId) {
      return this.nicknameMapper.get(userId) || "나간 사용자";
    },

    popUpRoleModal(targetUserRole, targetUserId) {
      if (targetUserId != this.userId && this.priorityMap.get(this.userRole) >= 4 && this.isUnderRole(targetUserRole)) {
        this.roleModalState = true;
        this.originTargetUserRole = targetUserRole;
        this.targetUserId = targetUserId;
      }
    },
    isEditable() {
      return this.priorityMap.get(this.userRole) >= 3;
    },
    isUnderRole(targetUserRole) {
      return this.priorityMap.get(targetUserRole) < this.priorityMap.get(this.userRole);
    },

    // close all modal
    closeModal() {
      this.nicknameModalState = false;
      this.titleModalState = false;
      this.roleModalState = false;
      this.originTargetUserRole = null;
      this.targetUserId = null;
    },

    // --- room api start ---
    changeTitle(result) {
      this.title = result;
      this.titleModalState = false;
    },

    // --- playlist api start ---
    async addVideo() {
      const videoId = this.extractYouTubeVideoId(this.videoUrlInput);

      if (videoId == null) {
        alert("해당 URL과 연관된 유튜브 영상을 찾을 수 없어요");
        return;
      }

      const result = await this.fetchVideo(videoId);

      axios.post(this.serverBaseUrl + "/playlists", {
        roomCode: this.roomCode,
        videoId: result.id,
        videoTitle: result.snippet.title,
        channelTitle: result.snippet.channelTitle,
        thumbnail: result.snippet.thumbnails.high.url,
        duration: result.contentDetails.duration,
      });

      this.videoUrlInput = "";
    },
    extractYouTubeVideoId(url) {
      const parsedURL = new URL(url);
      const searchParams = parsedURL.searchParams;
      const videoId = searchParams.get("v");

      return videoId;
    },

    async fetchVideo(videoId) {
      const response = await axios.get("https://www.googleapis.com/youtube/v3/videos", {
        params: {
          id: videoId,
          key: process.env.VUE_APP_YOUTUBE_DATA_API_KEY, // (주의) 공개하면 안됨 (주의)
          part: "snippet,contentDetails",
          fields: "items(id,contentDetails(duration),snippet(title,channelTitle,thumbnails(high)))",
        },
        withCredentials: false,
      });

      return response.data.items[0];
    },
    playNextVideo() {
      if (this.playlist.length == 0) {
        this.nextVideoErrorMessage = "재생목록이 비어있어요";
        return;
      }

      axios
          .post(this.serverBaseUrl + "/playlists/next", {
            videoNumber: this.playlist[0].videoNumber,
          })
          .catch((error) => {
            if (error.response.data.data == 404) {
              this.nextVideoErrorMessage = "마지막 영상이에요";
            }
          });
    },
    deleteVideo(videoNumber) {
      axios.delete(this.serverBaseUrl + "/playlists/" + videoNumber);
    },

    // --- YouTube Player & video synchronize ---
    onReady() {
      console.log("iframe Ready!");
      this.player = this.$refs.youtube;
      this.interval = setInterval(this.checkFocus, 100);
      this.enterRoom();
    },
    onPlayerStateChange(event) {
      // -1 : 시작되지 않음
      // 0 : 종료
      // 1 : 재생 중
      // 2 : 일시중지
      // 3 : 버퍼링
      // 5 : 동영상 신호

      // console.log('onPlayerStateChange 이벤트 발생! 상태 ' + this.player.getPlayerState() + ", 시간: " + this.player.getCurrentTime());
      // this.currentTime = this.player.getCurrentTime();
      this.playerState = event.target.getPlayerState();

      console.log(event);
      if (!this.statusLock && this.checkFocus && (event.data == 2 || event.data == 3) && this.isEditable()) {
        this.iframeLock = true;
        console.log('event target!!!')

        setTimeout(() => {
          if (this.playerState == 2) {
            this.pauseVideo(event.target.getCurrentTime());
          } else if (this.playerState == 1) {
            this.playVideo(event.target.getCurrentTime());
          }
          window.focus();
          setTimeout(() => {
            this.iframeLock = false;
          }, 1500);
        }, 600);
      }
    },
    onPlayerRateChange(event) {
      if (!this.statusLock && this.checkFocus && event.target.getPlaybackRate() != this.currentRate && this.isEditable()) {
        this.iframeLock = true;
        this.currentRate = event.target.getPlaybackRate();
        console.log('RATE 메세지 전송!');
        this.ws.send(
            "/pub/messages/video",
            JSON.stringify({
              messageType: "VIDEO_SYNC_INFO",
              roomCode: this.roomCode,
              playerState: "RATE",
              playerCurrentTime: this.currentTime,
              playerRate: this.currentRate,
            })
        );
        window.focus();
        setTimeout(() => {
          this.iframeLock = false;
        }, 1500);
      }
    },
    playVideo(currentTime) {
      console.log('PLAY 메세지 전송! --- ', currentTime);
      this.ws.send(
          "/pub/messages/video",
          JSON.stringify({
            messageType: "VIDEO_SYNC_INFO",
            roomCode: this.roomCode,
            playerState: "PLAY",
            playerCurrentTime: currentTime,
            playerRate: this.currentRate,
          })
      );
    },
    pauseVideo(currentTime) {
      console.log('PAUSE 메세지 전송! --- ', currentTime);
      this.ws.send(
          "/pub/messages/video",
          JSON.stringify({
            messageType: "VIDEO_SYNC_INFO",
            roomCode: this.roomCode,
            playerState: "PAUSE",
            playerCurrentTime: currentTime,
            playerRate: this.currentRate,
          })
      );
    },
    checkFocus() {
      // console.log(this.iframeLock);
      if (document.activeElement === this.$refs.youtube.$el.querySelector('iframe')) {
        this.focusFlag = true;
      } else {
        this.focusFlag = false;
      }
    },
  },

};
</script>

<style scoped>
#playlistVideoTitle {
  display: block;

  width: 130px;

  font-size: 12px;
  font-weight: 500;
  line-height: 1.2;

  padding-bottom: 3px;

  overflow: hidden;
  word-wrap: break-word;
  white-space: normal;
  text-align: left;
  text-overflow: ellipsis;

  line-clamp: 2;
  -webkit-line-clamp: 2;
}

.nextVideoError {
  color: #49dcb1;

  font-family: Pretendard;
  font-size: 12px;
  font-weight: 500;

  white-space: pre;
  text-align: left;

  margin-right: 5px;
}

.logo {
  font-weight: 800;
  text-align: left;
  color: #49dcb1;

  padding: 20px 0px;
}

.modalBackground {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 120%;
  background-color: #49dcb000;
  z-index: 100;
  bottom: 0;
}

.nicknameModal {
  position: absolute;
  top: 0px;
  left: -320px;
  z-index: 101;
}

.roleModal {
  position: absolute;
  top: -42px;
  left: 310px;
  z-index: 101;
}

.titleModal {
  position: absolute;
  top: 25px;
  left: 0px;
  z-index: 101;
}

td:hover {
  cursor: pointer;
}

.sideGroup {
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  height: 600px;

  margin-left: 10px;
}

.alarmIcon {
  font-weight: 800;
  color: #49dcb1;

  padding: 0px 5px 0px 0px;
}

.chatNickname {
  font-weight: 700;

  padding: 0px 10px 0px 0px;
}

.youtubeLink > input {
  width: 220px;
  height: 20px;

  padding: 8px 14px 8px 14px;

  border: none;
  border-radius: 10px;
  background-color: #303032;

  font-family: Pretendard;
  font-size: 13px;
  font-weight: 400;
  color: inherit;

  transition: 0.4s all ease-in-out;
}

.youtubeLink > input:focus {
  outline: none;
  background-color: #272729;
}

.trash,
.youtubeLink > button {
  width: 35px;
  height: 35px;

  border: none;
  border-radius: 18px;

  padding: 6px;
  margin: 5px;

  font-weight: 700;
  color: #49dcb1;
  background-color: #252527;
}

.trash:hover,
.youtubeLink > button:hover,
.youtubeLink > button:focus {
  cursor: pointer;
  outline: none;

  background-color: #303032;
}

.trash {
  width: 24px;
  height: 24px;

  margin: 0;
  padding: 0;
}

.innerContainer {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.information {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;

  padding: 20px 2px;
}

.informationTitle {
  position: relative;
  display: flex;
  justify-content: left;
  align-items: center;
}

.informationVideo {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  line-height: 1.6;

  padding-top: 10px;
}

.roomTitle {
  font-family: Pretendard;
  font-size: 17px;
  font-weight: 700;
}

.roomTitle:hover {
  cursor: pointer;
}

.nickname {
  font-family: Pretendard;
  font-size: 13px;
  font-weight: 500;
}

.frame {
  grid-row: 2;
  display: flex;

  justify-content: center;
}

.playlist {
  width: 300px;
  height: 150px;

  padding: 10px;

  border-radius: 10px;
  background-color: #181819;
}

.playlist > ul {
  width: inherit;
  height: 100px;

  padding: 0;
  margin: 10px 0px 10px 0px;

  overflow-x: hidden;
  overflow-y: auto;
}

.playlist > ul > li {
  width: 270px;
  min-height: 12px;

  list-style-type: none;

  padding: 5px 10px 5px 10px;

  font-family: Pretendard;
  font-size: 12px;
  font-weight: 400;

  text-align: left;
}

.video {
  display: flex;
  align-items: center;

  padding: 5px;
}

.chat {
  width: 320px;
  height: 320px;

  border-radius: 10px;
  background-color: #181819;
}

.chat > ul {
  width: inherit;
  height: 250px;

  padding: 0;
  margin: 10px 0px 10px 0px;

  overflow-x: hidden;
  overflow-y: auto;
}

.chat > ul > li {
  width: 270px;
  line-height: 2;

  list-style-type: none;

  padding: 5px 10px 5px 10px;

  color: inherit;

  font-family: Pretendard;
  font-size: 13px;

  text-align: left;
}

.chat > input {
  width: 260px;
  height: 20px;

  padding: 8px 14px 8px 14px;

  border: none;
  border-radius: 10px;
  background-color: #303032;

  font-family: Pretendard;
  font-size: 13px;
  font-weight: 400;
  color: inherit;

  transition: 0.4s all ease-in-out;
}

.chat > input:focus {
  outline: none;
  background-color: #272729;
}

.participantsList {
  position: relative;
  width: 320px;
  height: 70px;

  overflow-x: hidden;
  overflow-y: auto;
}

.participants {
  width: inherit;

  line-height: 1.8;

  padding: 10px;

  font-weight: 600;
  font-size: 12px;

  border: none;
  border-radius: 10px;
  background-color: #181819;
}

.me {
  padding: 0px 10px;

  color: #49dcb1;

  font-size: 12px;
  font-weight: 600;
}
</style>
