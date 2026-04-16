import { BadRequestException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { PaginationDto } from 'src/common/dto';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class ProductsService {

  constructor(
    private prisma: PrismaService
  ) { }

  async create(createProductDto: CreateProductDto) {
    const product = await this.prisma.product.create({
      data: createProductDto
    })
    return product;
  }

  async findAll(
    paginationDto: PaginationDto,
  ) {
    const { page, limit } = paginationDto;
    const totalPage = await this.prisma.product.count({ where: { available: true } });
    const lastPage = Math.ceil(totalPage / limit);
    return {
      data: await this.prisma.product.findMany({
        skip: (page - 1) * limit,
        take: limit,
        where: { available: true }
      }),
      meta: {
        total: totalPage,
        page,
        lastPage
      }
    };
  }

  async findOne(id: number) {
    const product = await this.prisma.product.findFirst({
      where: {
        id,
        available: true
      }
    });
    if (!product) {
      throw new RpcException({
        message: `Product with id #${id} not found`,
        status: HttpStatus.NOT_FOUND
      });
    }
    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    const { id: __, ...data } = updateProductDto;
    if (Object.keys(data).length === 0) {
      throw new RpcException({
        message: `No data provided to update product with id #${id}`,
        status: HttpStatus.BAD_REQUEST
      });
    }
    await this.findOne(id);
    return this.prisma.product.update({
      where: { id },
      data: updateProductDto
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    const product = await this.prisma.product.update({
      where: { id },
      data: { available: false }
    })
    return product;
  }

  async validateProducts(
    ids: number[]
  ) {
    ids = Array.from(new Set(ids));
    const products = await this.prisma.product.findMany({
      where: {
        id: { in: ids },
        available: true
      }
    })

    if (products.length !== ids.length) {
      throw new RpcException({
        message: `Some products with the provided IDs are not available or do not exist`,
        status: HttpStatus.BAD_REQUEST
      });
    }
    return products;
  }
}
