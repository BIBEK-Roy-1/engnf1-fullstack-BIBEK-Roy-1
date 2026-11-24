import Ticket from "../models/ticket.model.js";
import TicketEvent from "../models/ticket-event.model.js";

const TICKET_CATAGORIS=[
    "BILLING",
    "BUG",
    "FEATURE_REQUEST",
    "LOGIN",
    "DELIVERY"
];

const TICKET_PRIORITIES = [
    "LOW",
    "MEDIUM",
    "HIGH",
    "URGENT"
];

// Helper: create consistent errors
const createError = (message, statusCode, code) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.code = code;
    return error;
};

//Automatically categorize tickets using keywords
const categorizeTicket = (subject, body) => {
    const text = `${subject} ${body}`.toLowerCase();

    const rules = [
        {
            category: "BILLING",
            keywords: ["refund", "invoice", "charge", "payment"]
        },
        {
            category: "LOGIN",
            keywords: ["password", "2fa", "sign in", "locked out", "login"]
        },
         {
            category: "DELIVERY",
            keywords: ["package", "arrived", "shipping", "tracking", "delivery"]
        },

        {
            category: "BUG",
            keywords: ["crash", "error", "500", "exception", "broken",]
        },
    ];

    for (const rule of rules) {
        if (rule.keywords.some(keyword => text.includes(keyword))) {
            return rule.category;
        }
    }

    // Default category when no keyword matches
    return "FEATURE_REQUEST";
};

const determinePriority=(subject,body)=>{
    const text=`${subject} ${body}`.toLowerCase();
    const urgentKeywords=[
        "urgent","production down","locked out"
    ];

    const highKeywords=[
        "error", "refund", "not arrived"
    ]

    if(urgentKeywords.some(keyword=>text.includes(keyword))){
        return "URGENT";
    }

    if(highKeywords.some(keyword=>text.includes(keyword))){
        return "HIGH";
    }

    return "MEDIUM";
}


export const importTicketService=async(tickets)=>{

    //validate the request body

    if(!Array.isArray(tickets) || tickets.length==0){
        throw createError(
            "Ticket must be a non empty array"
            ,400
            ,"VALIDATION_ERROR"
        );
    }

    const normalizedTickets=tickets.map((ticket)=>{
        if(
            !ticket ||
            typeof ticket.externalId !=="string" ||
            typeof ticket.subject !=="string" ||
            typeof ticket.body !=="string"
        ){
            throw createError(
                "tickets must contain externalId,subject and body as strings",
                400,
                "VALIDATION_ERROR"
            );

        }

        const externalId=ticket.externalId.trim();
        const subject =ticket.subject.trim();
        const body=ticket.body.trim();

        if(!externalId){
            throw createError(
                "External ID is required",
                400,
                "VALIDATION_ERROR"
            );
        }

        if(subject.length<3 || subject.length>150){
            throw createError(
                "subject must be between 3 and 150 characters",
                400,
                "VALIDATION_ERROR"
            );
        }

        if(body.length<5 || body.length>2000){
            throw createError(
                "body must be between 5 and 2000 characters",
                400,
                "VALIDATION_ERROR"
            );
        }

        return {externalId,subject,body};

    });

    const externalIds=normalizedTickets.map(ticket=>ticket.externalId);

    if(new Set(externalIds).size!== externalIds.length){
        throw createError(
            "Duplicate external IDs found in the import batch",
            400,
            "VALIDATION_ERROR"
        );
    }

    let importedCount=0;
    let updatedCount=0;
    let skippedOverrideCount=0;

    for(const ticketData of normalizedTickets){
        const {externalId,subject,body}=ticketData;

        const existingTicket=await Ticket.findOne({externalId});

        const predictedCategory=categorizeTicket(subject,body);
        const predictedPriority=determinePriority(subject,body);

        //create ticket

        if(!existingTicket){
            await Ticket.create({
                externalId,
                subject,
                body,
                autoCategory:predictedCategory,
                category:predictedCategory,
                priority:predictedPriority,
                status:"OPEN",
                isHumanOverride:false,
                isReviewed:false

            });
            importedCount++;
            continue;
        }

        //check ticket content changes or not

        const contentChanged=existingTicket.subject !==subject  
                            || existingTicket.body!==body;

        if(contentChanged){
            existingTicket.subject=subject;
            existingTicket.body=body;
            updatedCount++;
        }

        //dont overwrite an agent's category

        if(existingTicket.isHumanOverride){
            skippedOverrideCount++;
        }else if(contentChanged){
            existingTicket.category=predictedCategory;
            existingTicket.priority=predictedPriority;
        }

        if (contentChanged){
            await existingTicket.save();
        }
    }

    return {
        total: normalizedTickets.length,
        importedCount,
        updatedCount,
        skippedOverrideCount,
    }


};