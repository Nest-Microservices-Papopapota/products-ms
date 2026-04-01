import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { PaginationDto } from 'src/common/dto';

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
      throw new NotFoundException(`Product with id #${id} not found`);
    }
    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    const { id: __, ...data } = updateProductDto;
    if (Object.keys(data).length === 0) {
      throw new BadRequestException(`No data provided to update product with id #${id}`);
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
}
