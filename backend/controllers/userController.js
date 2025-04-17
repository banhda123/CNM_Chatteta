import { UsersModel } from "../models/UserModel.js";
import { generateToken } from "../utils/index.js";
import cloudinary from "cloudinary";
import { ConversationModel } from "../models/ConversationModel.js";
import { MessageModel } from "../models/MessageModel.js";
import { sendSMS } from "../utils/sms.js";

export const getUser = async (req, res) => {
  const users = await UsersModel.find();
  res.send(users);
};

export const getUserById = async (req, res) => {
  const user = await UsersModel.findOne({ _id: req.params.id });
  if (user) {
    res.send(user);
  } else {
    res.status(403).send({ message: "user not found" });
  }
};

export const updateRefeshToken = (user, refeshToken) => {
  user.refeshToken = refeshToken;
  user.save();
};

export const Login = async (req, res) => {
  // Kiểm tra thông tin đầy đủ
  if (!req.body.phone || !req.body.password) {
    return res.status(400).send({ message: "Vui lòng điền đầy đủ thông tin" });
  }

  const user = await UsersModel.findOne({ 
    phone: req.body.phone,
    password: req.body.password 
  });

  if (user) {
    const tokens = generateToken(user);
    updateRefeshToken(user, tokens.refeshToken);

    res.send({
      _id: user._id,
      name: user.name,
      phone: user.phone,
      password: user.password,
      otp: user.otp || null,
      token: tokens.accessToken,
      refeshToken: tokens.refeshToken,
    });
  } else {
    res.status(403).send({ message: "Số điện thoại hoặc mật khẩu không đúng" });
  }
};

export const Register = async (req, res) => {
  console.log(req.body)
  const userExists = await UsersModel.findOne({ phone: req.body.phone });
  console.log(userExists)
  if (userExists) {
    res.status(400).send({ message: "Số điện thoại này đã đăng kí tài khoản" });
  } else {
    const user = new UsersModel({
      name: req.body.name,
      phone: req.body.phone,
      password: req.body.password,
      avatar: "https://res.cloudinary.com/daclejcpu/image/upload/v1744812771/avatar-mac-dinh-12_i7jnd3.jpg"
    });
    await user.save();

    res.status(200).send({
      _id: user._id,
      name: user.name,
      password: user.password,
      phone: user.phone,
      otp: "",
    });
  }
};

export const getNewToken = async (req, res) => {
  const refeshToken = req.body;
  const userExists = await UsersModel.findOne(refeshToken);
  if (userExists) {
    const tokens = generateToken(userExists);
    updateRefeshToken(userExists, tokens.refeshToken);
    res.send(tokens);
  } else {
    res.status(403).send({ message: "no refesh token" });
  }
};

export const UpdatePassword = async (req, res) => {
  const userExist = await UsersModel.findOne({ phone: req.body.email });
  if (userExist) {
    userExist.password = req.body.password;
    await userExist.save();
    res.send({ message: "Cập nhật mật khẩu thành công" });
  } else {
    res.status(403).send({ message: "Email này chưa đăng kí tài khoản" });
  }
};

function countDownOtp(time, user) {
  setTimeout(() => {
    user.otp = "";
    user.save();
  }, time);
}

export const sendMail = async (req, res) => {
  try {
    const { email } = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000);

    const userExist = await UsersModel.findOne({ phone: email });
    if (userExist) {
      countDownOtp(60000, userExist);
      userExist.otp = String(otp);
      await userExist.save();
      
      const smsSent = await sendSMS(email, otp);
      
      if (smsSent) {
        res.send({ 
          message: "Mã OTP đã được gửi đến số điện thoại của bạn",
          otp: otp
        });
      } else {
        res.status(500).send({ message: "Không thể gửi SMS" });
      }
    } else {
      res.status(403).send({ message: "Số điện thoại này chưa đăng kí tài khoản" });
    }
  } catch (error) {
    console.log(error);
    res.status(403).send({ message: "Không gửi được mã OTP" });
  }
};

export const checkCodeOtp = async (req, res) => {
  console.log("Request body:", req.body);
  const userExist = await UsersModel.findOne({ phone: req.body.email });
  console.log("User found:", userExist);
  
  if (userExist) {
    console.log("User OTP:", userExist.otp);
    console.log("Request OTP:", req.body.otp);
    
    if (req.body.otp === userExist.otp) {
      res.send({ message: "OTP đã đúng" });
    } else {
      res.status(403).send({ message: "OTP không đúng" });
    }
  } else {
    res.status(403).send({ message: "Số điện thoại này chưa đăng kí tài khoản" });
  }
};

export const changeAvatar = async (req, res) => {
  const userExist = await UsersModel.findById(req.body._id);
  const result = await cloudinary.uploader.upload(req.file.path, {
    folder: "zalo",
  });

  if (userExist) {
    if (
      userExist.avatar ===
      "https://res.cloudinary.com/daclejcpu/image/upload/v1744812771/avatar-mac-dinh-12_i7jnd3.jpg"
    ) {
      console.log("image default");
    } else {
      cloudinary.uploader.destroy(userExist.cloudinary_id);
    }

    userExist.avatar = result.secure_url;
    userExist.cloulinary_id = result.public_id;

    await userExist.save();
    res.send(userExist);
  } else {
    res.status(403).send({ mesage: "user not found" });
  }
};

export const searchUser = async (req, res) => {
  let user;
  if (req.body.id) {
    user = await UsersModel.findById(req.body.id);
  } else if (req.body.phone) {
    user = await UsersModel.findOne({ phone: req.body.phone });
  } else {
    return res.status(400).send({ message: "Vui lòng cung cấp ID hoặc số điện thoại" });
  }

  if (user) {
    res.send(user);
  } else {
    res.status(404).send({ message: "Không tìm thấy người dùng" });
  }
};

export const addFriend = async (req, res) => {
  try {
    const userFrom = req.user._id; // Lấy ID từ token
    const userTo = req.body.userTo;

    if (!userTo) {
      return res.status(400).send({ message: "Vui lòng cung cấp ID người dùng" });
    }

    const userToAccount = await UsersModel.findById(userTo);
    const userFromAccount = await UsersModel.findById(userFrom);

    if (!userToAccount || !userFromAccount) {
      return res.status(404).send({ message: "Không tìm thấy người dùng" });
    }

    // Kiểm tra đã là bạn bè chưa
    const isAlreadyFriend = userFromAccount.friends.some(friend => friend.idUser.toString() === userTo);
    if (isAlreadyFriend) {
      return res.status(400).send({ message: "Đã là bạn bè" });
    }

    // Kiểm tra đã gửi lời mời chưa
    const hasSentRequest = userFromAccount.myRequest.some(request => request.idUser.toString() === userTo);
    if (hasSentRequest) {
      return res.status(400).send({ message: "Đã gửi lời mời kết bạn" });
    }

    userToAccount.peopleRequest.push({ idUser: userFrom });
    userFromAccount.myRequest.push({ idUser: userTo });

    await userToAccount.save();
    await userFromAccount.save();

    res.send({ message: "Đã gửi lời mời kết bạn" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Lỗi server" });
  }
};

export const deleteRequestFriend = async (userFrom, userTo) => {
  const userToAccount = await UsersModel.findOne({ _id: userTo });
  const userFromAccount = await UsersModel.findOne({ _id: userFrom });

  if (userToAccount && userFromAccount) {
    userFromAccount.myRequest = userFromAccount.myRequest.filter(
      (x) => x.idUser != userTo
    );
    userToAccount.peopleRequest = userToAccount.peopleRequest.filter(
      (x) => x.idUser != userFrom
    );

    await userFromAccount.save();
    await userToAccount.save();
  }
};

export const acceptFriend = async (req, res) => {
  try {
    const { userFrom, userTo } = req.body;

    if (!userFrom || !userTo) {
      return res.status(400).send({ message: "Vui lòng cung cấp đầy đủ thông tin" });
    }

    const userFromAccount = await UsersModel.findById(userFrom);
    const userToAccount = await UsersModel.findById(userTo);

    if (!userFromAccount || !userToAccount) {
      return res.status(404).send({ message: "Không tìm thấy người dùng" });
    }

    // Kiểm tra xem có lời mời kết bạn không
    const hasRequest = userToAccount.peopleRequest.some(request => request.idUser.toString() === userFrom);
    if (!hasRequest) {
      return res.status(400).send({ message: "Không tìm thấy lời mời kết bạn" });
    }

    // Tạo cuộc trò chuyện mới
    const newConversation = new ConversationModel({
      type: "single",
      members: [
        { idUser: userFrom },
        { idUser: userTo }
      ]
    });
    await newConversation.save();

    // Cập nhật danh sách bạn bè
    userFromAccount.peopleRequest = userFromAccount.peopleRequest.filter(
      (x) => x.idUser.toString() !== userTo
    );
    userFromAccount.friends.push({
      idUser: userTo,
      idConversation: newConversation._id,
    });

    userToAccount.myRequest = userToAccount.myRequest.filter(
      (x) => x.idUser.toString() !== userFrom
    );
    userToAccount.friends.push({
      idUser: userFrom,
      idConversation: newConversation._id,
    });

    await userFromAccount.save();
    await userToAccount.save();

    res.send({ message: "Đã chấp nhận lời mời kết bạn" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Lỗi server" });
  }
};

export const DontAcceptFriend = async (userFrom, userTo) => {
  const userFromAccount = await UsersModel.findOne({ _id: userFrom });
  const userToAccount = await UsersModel.findOne({ _id: userTo });

  if (userFromAccount && userToAccount) {
    userFromAccount.peopleRequest = userFromAccount.peopleRequest.filter(
      (x) => x.idUser != userTo
    );

    userToAccount.myRequest = userToAccount.myRequest.filter(
      (x) => x.idUser != userFrom
    );

    await userFromAccount.save();
    await userToAccount.save();
  }
};

export const unFriend = async (userFrom, userTo, idConversation) => {
  await ConversationModel.findByIdAndDelete(idConversation);
  await MessageModel.deleteMany({ idConversation: idConversation });

  const userFromAccount = await UsersModel.findOne({ _id: userFrom });
  const userToAccount = await UsersModel.findOne({ _id: userTo });

  if (userFromAccount && userToAccount) {
    userFromAccount.friends = userFromAccount.friends.filter(
      (x) => x.idUser != userTo
    );

    userToAccount.friends = userToAccount.friends.filter(
      (x) => x.idUser != userFrom
    );

    await userFromAccount.save();
    await userToAccount.save();
  }
};

export const getAllPeopleRequestByUser = async (req, res) => {
  const list = await UsersModel.findById(req.params.id).populate({
    path: "peopleRequest.idUser",
    select: { name: 1, avatar: 1 },
  });
  res.send(list.peopleRequest);
};

export const getAllFriendByUser = async (req, res) => {
  const list = await UsersModel.findById(req.params.id).populate({
    path: "friends.idUser",
    select: { name: 1, avatar: 1 },
  });

  res.send(list.friends);
};

export const Demo = (req, res) => {
  res.send("dnsahbc");
};
