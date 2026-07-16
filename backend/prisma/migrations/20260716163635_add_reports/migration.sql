-- CreateTable
CREATE TABLE "reports" (
    "id" SERIAL NOT NULL,
    "noteId" INTEGER NOT NULL,
    "reason" VARCHAR(200),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reports_noteId_idx" ON "reports"("noteId");

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
