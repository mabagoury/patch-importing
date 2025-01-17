const mongoose = require("mongoose");

const leadSchema = mongoose.Schema({
  realmId: String,
  deleted: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null },
  deletedBy: { type: objectId, ref: "accounts" },
  lastAssignedDate: {
    type: Date,
    default: null,
  },
  customer: { type: objectId, ref: "customers" },
  leadInformation: {
    title: String,
    salutation: String,
    firstName: String,
    lastName: String,
    company: String,
    phone: String,
    mobile: String,
    email: String,
    secondaryEmail: String,
    secondaryPhone: String,
    leadImage: String,
    closeDate: String,
    address: {
      address: String,
      street: String,
      city: String,
      state: String,
      country: String,
      zip: String,
    },
  },
  units: [
    {
      unitId: { type: objectId, ref: "properties" },
      reservationId: { type: objectId, ref: "unitReservations" },
      _id: false,
    },
  ],
  converted: { type: Boolean, default: false, immutable: false },
  unitId: { type: objectId, ref: "properties" },
  contactId: { type: objectId, ref: "contacts" },
  promoId: String,
  leadtype: { type: String, default: "" },
  leadSource: String,
  leadOwner: { type: objectId, ref: "accounts" },
  status: String,
  leadRating: Number,
  activityLog: [
    {
      taskId: { type: objectId, ref: "tasks" },
      userId: { type: objectId, ref: "accounts" },
      activityNumber: Number,
      activity: String,
      activityDate: String,   // todo
      logs: String,
      outcome: String,
      time: String,  // todo
      activityDateTime: { type: Date },
      location: {
        type: {
          type: String,
          enum: ["Point"],
        },
        coordinates: {
          type: [Number],
        },
      },
      voiceNotes: [voiceNoteSchema]
    },
  ],
  leadDescription: String,
  notes: [String],
  documents: [{ uploadDate: String, fileUrl: String }],
  taskId: { type: objectId, ref: "tasks" },
  idengagerRequestId: String,
  leadNumber: { type: Number, sparse: true },
  uid: { type: String, unique: true, sparse: true },
  createdBy: { type: objectId, ref: "accounts" },
  modifiedBy: { type: objectId, ref: "accounts" },
  salesMan: { type: objectId, ref: "salesmen" },
  projectId: { type: objectId, ref: "projects" },
  region: String,
  customFields: Array,
  creationDate: String, // @deprecated
  modificationDate: String,  // todo
  setName: String,
  campaignName: String,
  dealSize: Number,
  workflow: [
    {
      level: Number,
      userId: { type: objectId, ref: "accounts" },
      action: String,
      approvalNotes: String,
      closeReason: String,
      rejectionReason: String,
      feedback: String,
    },
  ],
  workflowStart: {type: Boolean, default: false},
  workflowStartDate: {type: Date},
  interests: [String],
  territoryId: { type: objectId, ref: "salesterritorys", default: null },
  isFavorite: { type: Boolean, default: false },
  favoriteId: { type: objectId, ref: "favorites" },
  docStatus: String,
  humanworkflowId: { type: objectId, ref: "humanWorkflows" },
  favoritedBy: [{ type: objectId, ref: "accounts" }],
  additionalEmails: [String],
  additionalPhones: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  opportunityId: { type: objectId, ref: "opportunities" },
  proposalUrl: { type: String, default: null },
  tags: [String],
  assignedAccounts: [String],
  customField: { type: Object, default: {} },
  owner: { type: objectId, ref: "owners" },
  brokerId: { type: objectId, ref: "brokers" },
  brokerPrecentage: { type: Number },
  UDMPartyId: { type: objectId, ref: "UDMParty" },
  UDMContactId: { type: objectId, ref: "UDMContact" },
  collaborators: [CollaboratorSchema],
  claimer: { type: objectId, ref: "accounts" },
  claimedAt: { type: Date, default: null },
  templateWorkflowSetup: { // when specified, the workflow setup is cloned into the `workflowSetup` field
    type: mongoose.Schema.Types.ObjectId,
    ref: 'workflowSetups'
  },
  workflowSetup: [{ type: Object }],
  marketingSequenceId: { type: objectId, ref: "sequences" },
}, { timestamps: true} );

module.exports = mongoose.model("Lead", leadSchema);