const mongoose = require('mongoose')

const templateSchema = new mongoose.Schema ({
  _Id: {
    type: mongoose.Schema.Types.ObjectId
  },
  name: {
    type: String, 
    unique: true,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  version: {
    type: Number,
    required: true,
    default: 1
  },
  enabled: {
    type: Boolean,
    default: true
  },
  versions: [
    {
      version: {
        type: Number,
        required: true,
        default: 1,
        unique: true
      },
      documentDefinitionId: {
        type: String,
        required: true
      },
      documentData: {
        type: Object,
        required: true
      },
      template: {
        type: String,
        required: true
      },
      language: {
        type: String,
        default: "nb"
      },
    }
  ],
  createdTimestamp: {
    type: Date,
    default: new Date,
    required: true
  },
  createdBy: {
      type: String,
      default: "André Noen",
      required: true
  },
  createdById: {
      type: String,
      default: "00000000-0000-0000-0000-000000000000",
      required: true
  },
  modifiedTimestamp: {
      type: Date,
      default: new Date,
      required: true
  },
  modifiedBy: {
      type: String,
      default: "Noen André",
      required: true
  },
  modifiedById: {
      type: String,
      default: "00000000-0000-0000-0000-000000000000",
      required: true
  }
})

const Templates = mongoose.model('Templates', templateSchema)

module.exports = Templates