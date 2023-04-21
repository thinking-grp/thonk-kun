import * as thinkReplyer from "../";
import fs from "fs";

describe("generator", () => {
  it("generator.generateReply() 1", async () => {
    const text = "あなたはthinkReplyerです。";

    const result = await thinkReplyer.interact(text);

    expect(result).toBe("そうなんですね。教えてくれてありがとう。");
  });

  it("generator.generateReply() 2", async () => {
    const text = "あなたはthinkReplyerですか？";

    const result = await thinkReplyer.interact(text);

    expect(result).toBe("ごめんなさい、私にはわかりません...。");
  });

  it("generator.generateReply() 3", async () => {
    if (fs.existsSync(`${__dirname}/../temp/assets`)) {
      fs.readdir(`${__dirname}/../temp/assets`, function (err, files) {
        if (err) {
          throw err;
        }
        files.forEach(function (file) {
          fs.unlink(`${__dirname}/../temp/assets/${file}`, function (err) {
            if (err) {
              throw err;
            }
          });
        });
      });
    } else {
      if (!fs.existsSync(`${__dirname}/../temp`)) {
        fs.mkdirSync(`${__dirname}/../temp`);
      }

      if (!fs.existsSync(`${__dirname}/../temp/assets`)) {
        fs.mkdirSync(`${__dirname}/../temp/assets`);
      }
    }

    const text = "ソラキメはSorakimeです。";
    const question = "ソラキメはSorakimeですか？";

    await thinkReplyer.interact(text, [], {
      allowTrain: true,
      databaseDirectory: `${__dirname}/../temp/assets`,
    });

    const result = await thinkReplyer.interact(question, [], {
      databaseDirectory: `${__dirname}/../temp/assets`,
    });

    fs.readdir(`${__dirname}/../temp/assets`, function (err, files) {
      if (err) {
        throw err;
      }
      files.forEach(function (file) {
        fs.unlink(`${__dirname}/../temp/assets/${file}`, function (err) {
          if (err) {
            throw err;
          }
        });
      });
    });

    expect(result).toBe("はい、ソラキメはSorakimeです。");
  });
});
