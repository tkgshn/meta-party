- **ref/**: 参考資料や関連プロジェクトを格納するディレクトリです。
  - **futarchy**: 未来予測市場（Futarchy）に関するサブモジュール（[tkgshn/futarchy](https://github.com/tkgshn/futarchy)）です。
  - **Mirai-master-plan.md, v0.md**: プロジェクトの計画や仕様に関するドキュメントです。

## セットアップ方法

1. このリポジトリをクローンします（サブモジュールも含めて取得）：

   ```sh
   git clone --recurse-submodules https://github.com/tkgshn/meta-party.git
   ```

   すでにクローン済みの場合は、以下でサブモジュールを初期化できます：

   ```sh
   git submodule update --init --recursive
   ```

2. サブモジュール（futarchy）の内容は`ref/futarchy`に配置されます。

## サブモジュールの更新

サブモジュールの内容を最新にしたい場合は、

```sh
git submodule update --remote
```

を実行してください。
