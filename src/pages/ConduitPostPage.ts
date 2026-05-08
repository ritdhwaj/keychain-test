import { Page, Locator } from '@playwright/test';
import BasePage from '../base/BasePage';
import { logger } from '../utils/logger';

/**
 * ConduitPostPage - Handles article creation, editing, and deletion in the Conduit app
 *
 * @extends BasePage
 */
export class ConduitPostPage extends BasePage {
    // Editor Locators
    private readonly titleInput: Locator;
    private readonly descriptionInput: Locator;
    private readonly bodyInput: Locator;
    private readonly tagsInput: Locator;
    private readonly publishButton: Locator;

    // View/Action Locators
    private readonly editButton: Locator;
    private readonly deleteButton: Locator;
    private readonly articleTitle: Locator;
    private readonly articleBody: Locator;
    private readonly errorMessages: Locator;

    // Comments
    private readonly commentInput: Locator;
    private readonly postCommentButton: Locator;
    private readonly deleteCommentIcon: Locator;

    constructor(page: Page) {
        super(page);
        
        // Editor
        this.titleInput = page.getByPlaceholder('Article Title');
        this.descriptionInput = page.getByPlaceholder("What's this article about?");
        this.bodyInput = page.getByPlaceholder('Write your article (in markdown)');
        this.tagsInput = page.getByPlaceholder('Enter tags');
        this.publishButton = page.getByRole('button', { name: 'Publish Article' });

        // Article View
        this.editButton = page.getByRole('link', { name: ' Edit Article' });
        this.deleteButton = page.getByRole('button', { name: ' Delete Article' });
        this.articleTitle = page.locator('h1');
        this.articleBody = page.locator('.article-content p');
        this.errorMessages = page.locator('.error-messages');

        // Comments
        this.commentInput = page.getByPlaceholder('Write a comment...');
        this.postCommentButton = page.getByRole('button', { name: 'Post Comment' });
        this.deleteCommentIcon = page.locator('.mod-options .ion-trash-a');
        
        logger.info('ConduitPostPage initialized');
    }

    async createPost(title: string, description: string, body: string, tags: string): Promise<void> {
        logger.info(`Creating post: ${title}`);
        await this.fill(this.titleInput, title);
        await this.fill(this.descriptionInput, description);
        await this.fill(this.bodyInput, body);
        await this.fill(this.tagsInput, tags);
        await this.click(this.publishButton);
    }

    async updatePost(newTitle: string, newBody: string): Promise<void> {
        logger.info(`Updating post to: ${newTitle}`);
        await this.click(this.editButton);
        await this.fill(this.titleInput, newTitle);
        await this.fill(this.bodyInput, newBody);
        await this.click(this.publishButton);
    }

    async deletePost(): Promise<void> {
        logger.info('Deleting post');
        await this.click(this.deleteButton);
    }

    async getPostTitle(): Promise<string> {
        return (await this.articleTitle.textContent()) || '';
    }

    async getPostBody(): Promise<string> {
        return (await this.articleBody.textContent()) || '';
    }

    async addComment(comment: string): Promise<void> {
        logger.info(`Adding comment: ${comment}`);
        await this.fill(this.commentInput, comment);
        await this.click(this.postCommentButton);
    }

    async deleteComment(): Promise<void> {
        logger.info('Deleting comment');
        await this.click(this.deleteCommentIcon);
    }

    async getErrorMessages(): Promise<string[]> {
        return await this.errorMessages.locator('li').allTextContents();
    }
}
