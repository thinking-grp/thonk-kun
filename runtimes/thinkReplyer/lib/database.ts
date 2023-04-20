import * as fs from "fs";

export function getTokenDic(): TokenDic {
  if (!fs.existsSync(`${__dirname}/../assets/token_dictionary.db`)) {
    fs.writeFileSync(
      `${__dirname}/../assets/token_dictionary.db`,
      JSON.stringify([])
    );
  }

  return JSON.parse(
    fs.readFileSync(`${__dirname}/../assets/token_dictionary.db`, {
      encoding: "utf-8",
    })
  );
}

export type TokenMean = {
  usage: Token[][];
  negaposi?: number;
};

export type QuestionType =
  | "x-is-y"
  | "x-can-y"
  | "x-or-y"
  | "x-isnt-y"
  | "x-and-y"
  | "confirm";

export type SyntaxMean = {
  is?: Is[];
  can?: Can[];
  or?: Or[];
  isQuestion: boolean;
  isImperative?: boolean;
  question?: {
    type: QuestionType;
    when?: Date;
    where?: Token[];
    who?: Token[];
    what?: Token[];
  };
  isReply?: boolean;
  reply?: {
    positive?: boolean;
    what?: Token[];
  };
};

export type Token = {
  id: string;
  text: string;
  pos: string;
  pos_detail_1: string;
  pos_detail_2: string;
  pos_detail_3: string;
  conjugated_type: string;
  conjugated_form: string;
  basic_form: string;
  group: string[];
  raw_data: any;
  negaposi?: number;
  mean?: TokenMean;
};

export type TokenDic = Token[];

export function getSyntaxDic(): SyntaxDic {
  if (!fs.existsSync(`${__dirname}/../assets/syntax_dictionary.db`)) {
    fs.writeFileSync(
      `${__dirname}/../assets/syntax_dictionary.db`,
      JSON.stringify([])
    );
  }

  return JSON.parse(
    fs.readFileSync(`${__dirname}/../assets/syntax_dictionary.db`, {
      encoding: "utf-8",
    })
  );
}

export type Syntax = {
  id: string;
  tokens: Token[];
  mean?: SyntaxMean[];
  negaposi: number;
};

export type SyntaxDic = Syntax[];

export function getTokenGroupDic(): TokenGroupDic {
  if (!fs.existsSync(`${__dirname}/../assets/token_group_dictionary.db`)) {
    fs.writeFileSync(
      `${__dirname}/../assets/token_group_dictionary.db`,
      JSON.stringify([])
    );
  }

  return JSON.parse(
    fs.readFileSync(`${__dirname}/../assets/token_group_dictionary.db`, {
      encoding: "utf-8",
    })
  );
}

export type TokenGroup = {
  id: string;
  tokenIds: string[][];
  negaposi: number;
};

export type TokenGroupDic = TokenGroup[];

export function getReplySyntaxDic(): ReplySyntaxDic {
  if (!fs.existsSync(`${__dirname}/../assets/reply_syntax_dictionary.db`)) {
    fs.writeFileSync(
      `${__dirname}/../assets/reply_syntax_dictionary.db`,
      JSON.stringify([])
    );
  }

  return JSON.parse(
    fs.readFileSync(`${__dirname}/../assets/reply_syntax_dictionary.db`, {
      encoding: "utf-8",
    })
  );
}

export type ReplySyntax = {
  id: string;
  syntax: [Syntax, Syntax];
  negaposi: number;
  mean: SyntaxMean[];
};

export type ReplySyntaxDic = ReplySyntax[];

export type Is = [Token[], Token[]];

export type Or = {
  or: [Token[], Token[]];
  answer?: number;
};

export type Can = {
  who?: Token[];
  what: Token[];
  canI?: boolean;
  maybe?: boolean;
};

export type TwoTokensTypeKnowledgeTypes =
  | "x-is-y"
  | "x-isnt-y"
  | "x-is-in-y"
  | "x-is-similar-to-y"
  | "x-is-for-y"
  | "x-can-y"
  | "x-or-y"
  | "none";

export type HowToTypeKnowledgeTypes = "how-to";

export type KnowledgeTypes =
  | TwoTokensTypeKnowledgeTypes
  | HowToTypeKnowledgeTypes;

export type TwoTokensTypeKnowledge = {
  type: TwoTokensTypeKnowledgeTypes;
  id: string;
  is?: Is[];
  can?: Can[];
  or?: Or[];
  negaposi?: number;
  isQuestion?: boolean;
};

export type HowToStep = {
  syntax: Syntax;
  canI?: boolean;
};

export type HowToTypeKnowledge = {
  type: HowToTypeKnowledgeTypes;
  id: string;
  title: Token[];
  requirements: Token[][];
  steps: HowToStep[];
  canI?: boolean;
  negaposi?: number;
};

export type Knowledge = TwoTokensTypeKnowledge | HowToTypeKnowledge;

export type KnowledgeDic = Knowledge[];

export function getKnowledgeDic(): KnowledgeDic {
  if (!fs.existsSync(`${__dirname}/../assets/knowledge_dictionary.db`)) {
    fs.writeFileSync(
      `${__dirname}/../assets/knowledge_dictionary.db`,
      JSON.stringify([])
    );
  }

  return JSON.parse(
    fs.readFileSync(`${__dirname}/../assets/knowledge_dictionary.db`, {
      encoding: "utf-8",
    })
  );
}

export function setTokenDic(object: TokenDic) {
  fs.writeFileSync(
    `${__dirname}/../assets/token_dictionary.db`,
    JSON.stringify(object, null, "\t")
  );
}

export function setSyntaxDic(object: SyntaxDic) {
  fs.writeFileSync(
    `${__dirname}/../assets/syntax_dictionary.db`,
    JSON.stringify(object, null, "\t")
  );
}

export function setTokenGroupDic(object: TokenGroupDic) {
  fs.writeFileSync(
    `${__dirname}/../assets/token_group_dictionary.db`,
    JSON.stringify(object, null, "\t")
  );
}

export function setReplySyntaxDic(object: ReplySyntaxDic) {
  fs.writeFileSync(
    `${__dirname}/../assets/reply_syntax_dictionary.db`,
    JSON.stringify(object, null, "\t")
  );
}

export function setKnowledgeDic(object: KnowledgeDic) {
  fs.writeFileSync(
    `${__dirname}/../assets/knowledge_dictionary.db`,
    JSON.stringify(object, null, "\t")
  );
}

export function generateId(digit = 12): string {
  const characters = "abcdefghijklmnopqrstuvwxyz0123456789";
  let id = "";
  for (let i = 0; i < digit; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    id += characters.charAt(randomIndex);
  }
  return id;
}
