
import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import { connectDB } from "../config/db.js";

import User from "../models/user.model.js";
import Resource from "../models/resource.model.js";
import Ticket from "../models/ticket.model.js";

dotenv.config();


const seedUsers = async () => {

    const users = [
        {
            name: "Admin Lead",
            email: "admin@triagesync.test",
            password: process.env.SEED_ADMIN_PASSWORD,
            role: "ADMIN"
        },
        {
            name: "Agent Demo",
            email: "user@triagesync.test",
            password:  process.env.SEED_USER_PASSWORD,
            role: "USER"
        }
    ];

    for (const user of users) {
        // Checking user
        const existingUser = await User.findOne({
            email: user.email
        });

        if (!user.password) {
        throw new Error(`Missing seed password for ${user.email}`);
            }

        //user not present-create user
        if (!existingUser) {
            
            const passwordHash = await bcrypt.hash(
                user.password,
                10
            );

            await User.create({
                name: user.name,
                email: user.email,
                passwordHash,
                role: user.role
            });

            console.log(`Created user: ${user.email}`);
        } else {
            console.log(`User already exists: ${user.email}`);
        }
    }
};



const seedResources = async () => {
    const resources = [
        // ROOM resources
        {
            name: "room a",
            type: "ROOM",
            capacity: 20,
            description: "Main meeting room",
            isActive: true
        },
        {
            name: "room b",
            type: "ROOM",
            capacity: 15,
            description: "Secondary meeting room",
            isActive: true
        },

        // LAB resources
        {
            name: "lab a",
            type: "LAB",
            capacity: 30,
            description: "Computer laboratory",
            isActive: true
        },
        {
            name: "lab b",
            type: "LAB",
            capacity: 25,
            description: "Advanced computer laboratory",
            isActive: false
        },

        // EQUIPMENT resources
        {
            name: "equipment a",
            type: "EQUIPMENT",
            capacity: 1,
            description: "Portable diagnostic equipment",
            isActive: true
        },
        {
            name: "equipment b",
            type: "EQUIPMENT",
            capacity: 1,
            description: "Backup diagnostic equipment",
            isActive: true
        }
    ];

    for (const resource of resources) {

        // checking resource exist.
        const existingResource = await Resource.findOne({
            name: resource.name
        });

        if (!existingResource) {
            await Resource.create(resource);
            console.log(`Created resource: ${resource.name}`);
        } else {
            console.log(`Resource already exists: ${resource.name}`);
        }
    }
};


const seedTickets = async () => {
    const tickets = [
        {
            externalId: "SEED-001",
            subject: "Unable to login to my account",
            body: "I cannot sign in even after resetting my password.",
            category: "LOGIN",
            priority: "HIGH",
            isReviewed: true
        },
        {
            externalId: "SEED-002",
            subject: "Payment failed during checkout",
            body: "My payment failed but the amount was deducted.",
            category: "BILLING",
            priority: "URGENT",
            isReviewed: true
        },
        {
            externalId: "SEED-003",
            subject: "Package delivery is delayed",
            body: "My package has not arrived on the expected date.",
            category: "DELIVERY",
            priority: "HIGH",
            isReviewed: true
        },
        {
            externalId: "SEED-004",
            subject: "Application crashes on startup",
            body: "The application crashes whenever I try to open it.",
            category: "BUG",
            priority: "HIGH"
        },
        {
            externalId: "SEED-005",
            subject: "Request for dark mode",
            body: "Please add a dark mode option to the application.",
            category: "FEATURE_REQUEST",
            priority: "LOW"
        },
        {
            externalId: "SEED-006",
            subject: "Incorrect invoice amount",
            body: "The invoice contains an incorrect payment amount.",
            category: "BILLING",
            priority: "MEDIUM"
        },
        {
            externalId: "SEED-007",
            subject: "Two factor authentication issue",
            body: "I am unable to complete two factor authentication.",
            category: "LOGIN",
            priority: "URGENT"
        },
        {
            externalId: "SEED-008",
            subject: "Tracking information is unavailable",
            body: "My order tracking information is not updating.",
            category: "DELIVERY",
            priority: "MEDIUM"
        },
        {
            externalId: "SEED-009",
            subject: "Search feature is not working",
            body: "The search button produces an unexpected error.",
            category: "BUG",
            priority: "MEDIUM"
        },
        {
            externalId: "SEED-010",
            subject: "Add export functionality",
            body: "I would like to export reports as PDF files.",
            category: "FEATURE_REQUEST",
            priority: "LOW"
        },
        {
            externalId: "SEED-011",
            subject: "Refund not received",
            body: "My refund has not been credited to my account.",
            category: "BILLING",
            priority: "HIGH"
        },
        {
            externalId: "SEED-012",
            subject: "Account locked unexpectedly",
            body: "My account has been locked and I cannot access it.",
            category: "LOGIN",
            priority: "URGENT"
        },
        {
            externalId: "SEED-013",
            subject: "Delivery address needs correction",
            body: "I need to correct the delivery address for my order.",
            category: "DELIVERY",
            priority: "LOW"
        },
        {
            externalId: "SEED-014",
            subject: "Unexpected error on dashboard",
            body: "The dashboard displays an unexpected error message.",
            category: "BUG",
            priority: "MEDIUM"
        },
        {
            externalId: "SEED-015",
            subject: "<script>alert('XSS')</script> Broken checkout",
            body: "<img src=x onerror=alert('XSS')> Please investigate this issue.",
            category: "BUG",
            priority: "HIGH"
        }
    ];

    for (const ticket of tickets) {
        // check tickets exist
        const existingTicket = await Ticket.findOne({
            externalId: ticket.externalId
        });

        if (!existingTicket) {
            await Ticket.create({
                externalId: ticket.externalId,
                subject: ticket.subject,
                body: ticket.body,

                
                autoCategory: ticket.category,

                category: ticket.category,

                isHumanOverride: false,
                priority: ticket.priority,
                status: "OPEN",
                assigneeId: null,
                isReviewed: ticket.isReviewed ?? false
            });

            console.log(`Created ticket: ${ticket.externalId}`);
        } else {
            console.log(`Ticket already exists: ${ticket.externalId}`);
        }
    }
};



const runSeed = async () => {
    try {

        await connectDB();


        await seedUsers();
        await seedResources();
        await seedTickets();

        console.log("\nDatabase seeding completed successfully.");
    } catch (error) {
        console.error("\nDatabase seeding failed:", error);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
        console.log("MongoDB connection closed.");
    }
};

runSeed();
