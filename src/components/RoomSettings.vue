<template>
  <form class="roomSettings">
    <span id="mainLogo">youtogether</span>
    <label for="title">제목</label>
    <input
      id="title"
      v-model="roomSettings.title"
      type="text"
      placeholder="제목은 1자 이상 30자 이하로 입력해주세요"
      autofocus />
    <span>{{ errorMessage.title }}</span>
    <label for="capacity">정원</label>
    <input
      id="capacity"
      v-model="roomSettings.capacity"
      type="number"
      min="2"
      max="10"
      placeholder="정원은 2명 이상 10명 이하로 입력해주세요" />
    <span>{{ errorMessage.capacity }}</span>
    <label for="password">비밀번호 (선택)</label>
    <input
      id="password"
      v-model="roomSettings.password"
      type="text"
      placeholder="비밀번호는 5자 이상 10자 이하의 영문 또는 숫자로 입력해주세요" />
    <span>{{ errorMessage.password }}</span>
    <button style="margin-top: 30px" type="submit" @click.prevent="create">방 만들기</button>
    <button type="submit" @click.prevent="backTolist">목록으로 돌아가기</button>
  </form>
</template>

<script scoped>
import axios from "axios";
axios.defaults.withCredentials = true;

export default {
  data() {
    return {
      // roomCreateUrl: "https://you-together.site/rooms",
      roomCreateUrl: "http://localhost:8080/rooms",
      roomSettings: { title: null, capacity: null, password: null },
      errorMessage: { title: null, capacity: null, password: null },
    };
  },
  methods: {
    create() {
      if (this.roomSettings.password != null && this.roomSettings.password.length == 0) {
        this.roomSettings.password = null;
      }

      axios
        .post(this.roomCreateUrl, this.roomSettings)
        .then((res) => {
          if (res.data.code == 201) {
            localStorage.setItem('roomPassword_' + res.data.data.roomCode, res.data.data.password);
            this.$router.push("/rooms/" + res.data.data.roomCode);
          }
        })
        .catch((error) => {
          error = error.response.data;

          if (error.code == 400 && error.data.length > 0) {
            if (error.data[0].type == "SingleRoomParticipationViolationException") {
              alert(
                "하나의 방에만 참가할 수 있어요.\n이미 방을 만들었거나 다른 방에 참가 중이라면 새로운 방을 만들 수 없어요."
              );
            } else {
              this.errorMessage = { title: null, capacity: null, password: null };
              error.data.forEach((element) => {
                this.errorMessage[element.type] = element.message;
              });
            }
          }
        });
    },
    backTolist() {
      this.$router.push("/rooms");
    }
  },
};
</script>

<style scoped>
.roomSettings {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  width: 320px;
  min-height: 530px;

  padding: 50px;
  margin: auto;
}

.roomSettings > label {
  align-self: flex-start;

  font-size: 13px;
  font-weight: 600;

  padding: 10px 5px 10px 5px;
}

.roomSettings > input {
  width: 310px;
  height: 30px;

  padding: 8px 14px 8px 14px;
  margin-bottom: 25px;

  border: none;
  border-radius: 12px;
  background-color: #252527;

  box-sizing: content-box;
  box-shadow: 0 1px 1px #8a817c43;

  font-family: Pretendard;
  font-size: 12px;
  font-weight: 500;
  color: inherit;

  transition: 0.4s all ease-in-out;
}

.roomSettings > input:focus {
  outline: none;

  background-color: #303032;
}

.roomSettings > span {
  height: 10px;

  color: #49dcb1;

  font-family: Pretendard;
  font-size: 11px;
  font-weight: 500;

  position: relative;
  top: -20px;
  z-index: 2;
}

.roomSettings > button {
  width: 140px;
  height: 48px;

  border: none;
  border-radius: 12px;

  padding: 8px;
  margin: 15px;

  color: #49dcb1;
  background-color: #252527;

  font-family: Pretendard;
  font-size: 13px;
  font-weight: 600;

  transition: 0.3s all ease-in-out;
}

.roomSettings > button:hover,
.roomSettings > button:focus {
  cursor: pointer;
  outline: none;

  background-color: #303032;
}

#mainLogo {
  font-size: 16px;
  font-weight: 700;
  color: #49dcb1;

  padding: 20px;
}
</style>
