import * as tokenManager from "./token";
import * as tokenGroupManager from "./token_group";
import * as database from "./database";
import * as syntaxManager from "./syntax";
import * as knowledgeManager from "./knowledge";

export type GenerateOptions = {
  allowTrain?: boolean;
  databaseDirectory?: string;
};

export async function generateReply(
  text: string,
  history: string[],
  options: GenerateOptions = {
    allowTrain: false,
    databaseDirectory: `${__dirname}/../assets/`,
  }
): Promise<database.Token[]> {
  if (!options.databaseDirectory)
    options.databaseDirectory = `${__dirname}/../assets/`;

  if (text.startsWith("/##-")) {
    let result: database.Token[] = [];

    if (text.slice(4) === "ping")
      result = tokenManager.convertKuromojisToTokens(
        await tokenManager.tokenize("Pong!")
      );

    return result;
  }

  let result: database.Token[] = [];
  const replyTokens = await tokenManager.tokenize(text);

  const tokens2Negaposi = tokenManager.getTokensNegaposi(replyTokens);

  const convertedReplyTokens = tokenManager.convertKuromojisToTokens(
    replyTokens,
    tokens2Negaposi
  );

  const filteredReplyTokens = tokenManager.replaceExistingTokens(
    convertedReplyTokens,
    options.databaseDirectory
  );

  const replySyntax = syntaxManager.createSyntax(filteredReplyTokens);

  if (!replySyntax.mean)
    replySyntax.mean = syntaxManager.createSyntaxMean(replySyntax);

  if (!replySyntax.mean[0]) throw new Error();

  if (options.allowTrain) {
    tokenManager.addTokensToDatabase(
      filteredReplyTokens,
      options.databaseDirectory
    );

    if (
      syntaxManager.getDuplicationSyntaxsFromDatabase(replySyntax).length === 0
    ) {
      syntaxManager.addSyntaxToDatabase(replySyntax, options.databaseDirectory);
    }
  }

  if (replySyntax.mean[0].isImperative && replySyntax.mean[0].isQuestion) {
    const tokens = tokenManager.convertKuromojisToTokens(
      await tokenManager.tokenize("ごめんなさい、私にはできません...。")
    );

    result = tokens;
  } else if (replySyntax.mean[0].isQuestion) {
    if (replySyntax.mean[0].question) {
      if (
        replySyntax.mean[0].question.type === "x-is-y" &&
        replySyntax.mean[0].is
      ) {
        if (!replySyntax.mean[0].is[0]) {
          const tokens = tokenManager.convertKuromojisToTokens(
            await tokenManager.tokenize(
              "ごめんなさい、文章を理解できませんでした...。"
            )
          );

          result = tokens;
        } else {
          const knowledges = knowledgeManager.getKnowledgeFromDatabase(
            replySyntax.mean[0].question.type,
            replySyntax.mean[0].is[0][0],
            options.databaseDirectory
          );

          if (knowledges.length === 0) {
            const tokens = tokenManager.convertKuromojisToTokens(
              await tokenManager.tokenize(
                "ごめんなさい、私にはわかりません...。"
              )
            );

            result = tokens;
          } else if (knowledges[0].type !== "x-is-y" || !knowledges[0].is) {
            const tokens = tokenManager.convertKuromojisToTokens(
              await tokenManager.tokenize(
                "ごめんなさい、私にはわかりません...。"
              )
            );

            result = tokens;
          } else {
            const knowledgeTokens = [
              knowledges[0].is[0][0],
              knowledges[0].is[0][1],
            ];

            const replyTokens = [
              replySyntax.mean[0].is[0][0],
              replySyntax.mean[0].is[0][1],
            ];

            let tokens: database.Token[];

            if (
              tokenManager.convertTokensToString(knowledgeTokens[0]) ===
              "あなた"
            ) {
              tokens = tokenManager.convertKuromojisToTokens(
                await tokenManager.tokenize(
                  `私は${tokenManager.convertTokensToString(
                    knowledgeTokens[1]
                  )}です。`
                )
              );
            } else if (tokenGroupManager.isWhatToken(replyTokens[1][0])) {
              tokens = tokenManager.convertKuromojisToTokens(
                await tokenManager.tokenize(
                  `${tokenManager.convertTokensToString(
                    knowledgeTokens[0]
                  )}は${tokenManager.convertTokensToString(
                    knowledges[0].is[0][1]
                  )}です。`
                )
              );

              result = tokens;
            } else {
              if (
                knowledges[0].is[0] &&
                JSON.stringify(knowledges[0].is[0][1]) ===
                  JSON.stringify(replyTokens[1])
              ) {
                tokens = tokenManager.convertKuromojisToTokens(
                  await tokenManager.tokenize(
                    `はい、${tokenManager.convertTokensToString(
                      knowledgeTokens[0]
                    )}は${tokenManager.convertTokensToString(
                      knowledgeTokens[1]
                    )}です。`
                  )
                );
              } else {
                tokens = tokenManager.convertKuromojisToTokens(
                  await tokenManager.tokenize(
                    `いいえ、${tokenManager.convertTokensToString(
                      knowledgeTokens[0]
                    )}は${tokenManager.convertTokensToString(
                      knowledgeTokens[1]
                    )}です。`
                  )
                );
              }

              result = tokens;
            }
          }
        }
      } else if (
        replySyntax.mean[0].question.type === "x-isnt-y" &&
        replySyntax.mean[0].is
      ) {
        const knowledges = knowledgeManager.getKnowledgeFromDatabase(
          replySyntax.mean[0].question.type,
          replySyntax.mean[0].is[0][0],
          options.databaseDirectory
        );

        if (knowledges.length === 0) {
          const tokens = tokenManager.convertKuromojisToTokens(
            await tokenManager.tokenize("ごめんなさい、私にはわかりません...。")
          );

          result = tokens;
        } else if (knowledges[0].type !== "x-isnt-y" || !knowledges[0].is) {
          const tokens = tokenManager.convertKuromojisToTokens(
            await tokenManager.tokenize("ごめんなさい、私にはわかりません...。")
          );

          result = tokens;
        } else {
          const knowledgeTokens = [
            knowledges[0].is[0][0],
            knowledges[0].is[0][1],
          ];

          const replyTokens = [
            replySyntax.mean[0].is[0][0],
            replySyntax.mean[0].is[0][1],
          ];

          let tokens: database.Token[];

          if (
            tokenManager.convertTokensToString(knowledgeTokens[0]) === "あなた"
          ) {
            tokens = tokenManager.convertKuromojisToTokens(
              await tokenManager.tokenize(
                `私は${tokenManager.convertTokensToString(
                  knowledgeTokens[1]
                )}です。`
              )
            );
          } else if (tokenGroupManager.isWhatToken(replyTokens[1][0])) {
            tokens = tokenManager.convertKuromojisToTokens(
              await tokenManager.tokenize(
                `${tokenManager.convertTokensToString(
                  knowledgeTokens[0]
                )}は${tokenManager.convertTokensToString(
                  knowledges[0].is[0][1]
                )}です。`
              )
            );

            result = tokens;
          } else {
            if (
              knowledges[0].is[0] &&
              JSON.stringify(knowledges[0].is[0][1]) ===
                JSON.stringify(replyTokens[1])
            ) {
              tokens = tokenManager.convertKuromojisToTokens(
                await tokenManager.tokenize(
                  `はい、${tokenManager.convertTokensToString(
                    knowledgeTokens[0]
                  )}は${tokenManager.convertTokensToString(
                    knowledgeTokens[1]
                  )}です。`
                )
              );
            } else {
              tokens = tokenManager.convertKuromojisToTokens(
                await tokenManager.tokenize(
                  `いいえ、${tokenManager.convertTokensToString(
                    knowledgeTokens[0]
                  )}は${tokenManager.convertTokensToString(
                    knowledgeTokens[1]
                  )}です。`
                )
              );
            }

            result = tokens;
          }
        }
      } else if (
        replySyntax.mean[0].question.type === "x-can-y" &&
        replySyntax.mean[0].can
      ) {
        const knowledges = knowledgeManager.getKnowledgeFromDatabase(
          replySyntax.mean[0].question.type,
          replySyntax.mean[0].can[0].what,
          options.databaseDirectory
        );

        if (knowledges.length === 0) {
          const tokens = tokenManager.convertKuromojisToTokens(
            await tokenManager.tokenize("ごめんなさい、私にはわかりません...。")
          );

          result = tokens;
        } else if (knowledges[0].type !== "x-can-y" || !knowledges[0].can) {
          const tokens = tokenManager.convertKuromojisToTokens(
            await tokenManager.tokenize("ごめんなさい、私にはわかりません...。")
          );

          result = tokens;
        } else {
          const tokens = tokenManager.convertKuromojisToTokens(
            await tokenManager.tokenize(
              `${tokenManager.convertTokensToString(
                knowledges[0].can[0].what
              )}はできません。`
            )
          );

          result = tokens;
        }
      } else {
        const tokens = tokenManager.convertKuromojisToTokens(
          await tokenManager.tokenize("ごめんなさい、私にはわかりません...。")
        );

        result = tokens;
      }
    }
  } else if (replySyntax.mean[0].isImperative) {
    const tokens = tokenManager.convertKuromojisToTokens(
      await tokenManager.tokenize("ごめんなさい、私にはできません...。")
    );

    result = tokens;
  } else if (
    replySyntax.mean[0].question?.type !== "none" &&
    replySyntax.mean[0].question?.type
  ) {
    if (options.allowTrain) {
      if (
        syntaxManager.getDuplicationSyntaxsFromDatabase(replySyntax).length ===
        0
      ) {
        replySyntax.mean = syntaxManager.createSyntaxMean(replySyntax);

        syntaxManager.addSyntaxToDatabase(
          replySyntax,
          options.databaseDirectory
        );
      }

      if (
        knowledgeManager.isTwoTokensKnowledge(replySyntax) &&
        !syntaxManager.isQuestion(replySyntax.tokens)
      ) {
        const knowledge =
          knowledgeManager.createTwoTokensKnowledge(replySyntax);

        knowledgeManager.addKnowledgeToDatabase(
          knowledge,
          options.databaseDirectory
        );

        const tokens = tokenManager.convertKuromojisToTokens(
          await tokenManager.tokenize("そうなんですね。覚えました。")
        );

        result = tokens;
      } else {
        const tokens = tokenManager.convertKuromojisToTokens(
          await tokenManager.tokenize(
            "そうなんですね。教えてくれてありがとう。"
          )
        );

        result = tokens;
      }
    } else {
      const tokens = tokenManager.convertKuromojisToTokens(
        await tokenManager.tokenize("そうなんですね。教えてくれてありがとう。")
      );

      result = tokens;
    }
  } else {
    const tokens = tokenManager.convertKuromojisToTokens(
      await tokenManager.tokenize("そうなんですね。")
    );

    result = tokens;
  }

  return result;
}
