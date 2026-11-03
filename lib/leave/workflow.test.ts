import assert from "node:assert/strict";
import test from "node:test";
import { canWithdraw, decide, initialStatus, resolveAssignee } from "./workflow";

test("krótki wniosek po przełożonym idzie do kadr, długi do dyrektora", () => {
  const short = decide({
    status: "oczekuje_przelozonego",
    action: "accept",
    actor: "manager",
    comment: "",
    requiresDirector: false,
    directorIsAvailable: true,
  });
  assert.equal(short.ok && short.status, "oczekuje_kadr");

  const long = decide({
    status: "oczekuje_przelozonego",
    action: "accept",
    actor: "manager",
    comment: "",
    requiresDirector: true,
    directorIsAvailable: true,
  });
  assert.equal(long.ok && long.status, "oczekuje_dyrektora");
});

test("odrzucenie i cofnięcie bez komentarza odpadają", () => {
  const rejected = decide({
    status: "oczekuje_przelozonego",
    action: "reject",
    actor: "manager",
    comment: "   ",
    requiresDirector: false,
    directorIsAvailable: false,
  });
  assert.equal(rejected.ok, false);
});

test("dyrektor cofa do przełożonego, kadry zatwierdzają", () => {
  const back = decide({
    status: "oczekuje_dyrektora",
    action: "return_manager",
    actor: "director",
    comment: "Ustal zastępstwo",
    requiresDirector: true,
    directorIsAvailable: true,
  });
  assert.equal(back.ok && back.status, "oczekuje_przelozonego");

  const approved = decide({
    status: "oczekuje_kadr",
    action: "accept",
    actor: "hr",
    comment: "",
    requiresDirector: true,
    directorIsAvailable: true,
  });
  assert.equal(approved.ok && approved.status, "zaakceptowany");
});

test("wycofanie jest możliwe tylko przed zatwierdzeniem", () => {
  assert.equal(canWithdraw("oczekuje_kadr"), true);
  assert.equal(canWithdraw("zaakceptowany"), false);
  assert.equal(canWithdraw("roboczy"), false);
});

test("wnioskujący na szczycie struktury startuje od kadr, gdy nie może akceptować sam siebie", () => {
  const start = initialStatus({
    managerAssigneeId: null,
    directorAssigneeId: null,
    requiresDirector: true,
  });
  assert.equal(start.status, "oczekuje_kadr");
});

test("zastępstwo akceptującego obowiązuje tylko w swoim terminie", () => {
  const substitutions = [
    {
      approverEmployeeId: "robert",
      substituteEmployeeId: "basia",
      dateFrom: "2026-12-01",
      dateTo: "2026-12-07",
    },
  ];
  assert.equal(resolveAssignee("robert", "2026-12-03", substitutions), "basia");
  assert.equal(resolveAssignee("robert", "2026-11-03", substitutions), "robert");
});
