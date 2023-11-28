const router = require("express").Router();
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const generateIdenticon = require("../utils/generateIdenticon");

const prisma = new PrismaClient();


//  新規ユーザ登録API
router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  const defaultIconImage = generateIdenticon(email);

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      username,
      email,
      password: hashedPassword,
      profile: {
        create: {
          bio: "はじめまして",
          profileImageUrl: defaultIconImage
        }
      }
    },
    include: {
      profile: true
    }
  });

  return res.json({ user });
});

//  ユーザログインAPI
//  トークンをクライアントに渡す
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return res.status(401).json({ error: "そのユーザは存在しません。" });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return res.status(401).json({ error: "そのパスワードは間違っています" });
  }

  const token = jwt.sign({ id: user.id }, process.env.SECRET_KEY, {
    expiresIn: "1d",
  });

  return res.json({ token });

});

module.exports = router;

// JWTはエンコードされた時ランダムな文字列になっており、それはヘッダー・ペイロード・暗号化のやり方の３つが含まれている
// トークンをクライアント側に保存して適宜許可を確認してログイン状態を保つことが出来る