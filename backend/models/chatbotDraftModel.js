const { getCollections } = require("../config/db");

const ACTIVE_CHATBOT_DRAFT_STATUS = "active";
const DEFAULT_CHATBOT_CONVERSATION_ID = "default";

const getDraftFilter = (userId, conversationId = DEFAULT_CHATBOT_CONVERSATION_ID) => ({
  userId,
  conversationId,
  status: ACTIVE_CHATBOT_DRAFT_STATUS,
});

const findActiveChatbotDraft = (
  userId,
  conversationId = DEFAULT_CHATBOT_CONVERSATION_ID
) => {
  const { chatbotDraftsCollection } = getCollections();
  return chatbotDraftsCollection.findOne(getDraftFilter(userId, conversationId));
};

const upsertChatbotDraftEvidence = async (
  userId,
  evidence,
  conversationId = DEFAULT_CHATBOT_CONVERSATION_ID
) => {
  const { chatbotDraftsCollection } = getCollections();
  const now = new Date();

  const draftUpdate = {};

  if (evidence?.evidenceUrl) {
    Object.assign(draftUpdate, {
      evidenceUrl: evidence.evidenceUrl,
      evidencePublicId: evidence.evidencePublicId,
      evidenceResourceType: evidence.evidenceResourceType,
      evidenceMimeType: evidence.evidenceMimeType,
      evidenceType: evidence.evidenceType,
      evidenceName: evidence.evidenceName,
      evidenceSize: evidence.evidenceSize,
    });
  }

  const updateOperation = {
    $set: {
      updatedAt: now,
    },
    $setOnInsert: {
      userId,
      conversationId,
      status: ACTIVE_CHATBOT_DRAFT_STATUS,
      createdAt: now,
    },
  };

  if (Object.keys(draftUpdate).length > 0) {
    Object.assign(updateOperation.$set, draftUpdate);
  }

  console.log("[UPSERT CHATBOT DRAFT EVIDENCE]", {
    userId: userId?.toString(),
    conversationId,
    hasEvidenceUrl: Boolean(evidence?.evidenceUrl),
    evidenceUrl: evidence?.evidenceUrl || null,
    evidencePublicId: evidence?.evidencePublicId || null,
    draftUpdateKeys: Object.keys(draftUpdate),
  });

  const result = await chatbotDraftsCollection.findOneAndUpdate(
    getDraftFilter(userId, conversationId),
    updateOperation,
    {
      upsert: true,
      returnDocument: "after",
      includeResultMetadata: false,
    }
  );

  console.log("[UPSERT CHATBOT DRAFT EVIDENCE RESULT]", {
    userId: userId?.toString(),
    resultIsNull: result === null,
    resultType: typeof result,
    resultHasValue: Boolean(result?.value),
    resultEvidenceUrl: result?.evidenceUrl || result?.value?.evidenceUrl || null,
    resultEvidencePublicId: result?.evidencePublicId || result?.value?.evidencePublicId || null,
  });

  return result;
};

const deleteActiveChatbotDraft = (
  userId,
  conversationId = DEFAULT_CHATBOT_CONVERSATION_ID
) => {
  const { chatbotDraftsCollection } = getCollections();
  return chatbotDraftsCollection.deleteOne(getDraftFilter(userId, conversationId));
};

module.exports = {
  DEFAULT_CHATBOT_CONVERSATION_ID,
  deleteActiveChatbotDraft,
  findActiveChatbotDraft,
  upsertChatbotDraftEvidence,
};
