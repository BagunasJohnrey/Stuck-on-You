-- CreateTable
CREATE TABLE "notes" (
    "id" SERIAL NOT NULL,
    "to_name" VARCHAR(50),
    "message" VARCHAR(300) NOT NULL,
    "alias" VARCHAR(30),
    "color" VARCHAR(7) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prohibited_words" (
    "id" SERIAL NOT NULL,
    "word" TEXT NOT NULL,

    CONSTRAINT "prohibited_words_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notes_created_at_idx" ON "notes"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "prohibited_words_word_key" ON "prohibited_words"("word");
