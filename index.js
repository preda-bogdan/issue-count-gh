#!/usr/bin/env node

const { Octokit } = require("@octokit/core");
const commander = require("commander");

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

async function getIssuesWithLabel(repoName, label) {

    const today = new Date();
    const weekStart = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() - today.getDay() + 1 - 7
    ).toISOString().slice(0, 10); // last Monday
    const weekEnd = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() - today.getDay() + 1
    ).toISOString().slice(0, 10); // this Monday

    let newStartDate = new Date(Date.parse(weekStart)).toISOString();
    let newEndDate = new Date(Date.parse(weekEnd)).toISOString();


    const response = await octokit.request(`GET /repos/${repoName}/issues`, {
        labels: label,
        since: newStartDate,
        state: "open",
    });

    const issues = response.data.filter((issue) => {
        return (
            issue.created_at >= newStartDate &&
            issue.created_at <= newEndDate &&
            issue.state !== "closed"
        );
    }).map((issue) => {
        return {
            title: issue.title,
            url: issue.url,
            created_at: issue.created_at,
            state: issue.state,
        };
    });


    return issues;
}

commander
    .version("1.0.0")
    .arguments("<repo> <label>")
    .description(
        "Fetches issues from a Github repository with a specific label and within a given time frame."
    )
    .action(async (repo, label, startDate, endDate) => {
        try {
            const issues = await getIssuesWithLabel(repo, label, startDate, endDate);

            issues.forEach((issue) => {
                console.log("Title:", issue.title);
                console.log("Url:", issue.url);
                console.log("Created at:", issue.created_at);
                console.log("Status:", issue.state);
                console.log("--------------------------------------------");
            });

            console.log(`Fetched ${issues.length} issues with label "${label}".`);
        } catch (err) {
            console.error(err);
        }
    })
    .parse(process.argv);